const prisma = require("../../config/db");
const { paginate, paginateMeta } = require("../../utils/pagination");

const prescriptionInclude = {
	patient: {
		select: {
			id: true,
			patientCode: true,
			fullName: true,
			phone: true,
			gender: true,
		},
	},
	encounter: {
		select: {
			id: true,
			visitDateAD: true,
			assessment: true,
			plan: true,
		},
	},
	prescribedBy: {
		select: {
			id: true,
			fullName: true,
			role: true,
			specialization: true,
		},
	},
	items: {
		include: {
			inventoryItem: {
				select: {
					id: true,
					itemCode: true,
					name: true,
					genericName: true,
					unit: true,
					currentStock: true,
					sellingPrice: true,
				},
			},
			dispenseRecords: {
				include: {
					dispensedBy: {
						select: { id: true, fullName: true, role: true },
					},
					inventoryItem: {
						select: { id: true, itemCode: true, name: true, unit: true },
					},
				},
				orderBy: { dispensedAt: "desc" },
			},
		},
		orderBy: { createdAt: "asc" },
	},
};

const cleanText = (value) => {
	if (value === undefined || value === null) return null;
	const trimmed = String(value).trim();
	return trimmed ? trimmed : null;
};

const derivePrescriptionStatusFromItems = (items) => {
	if (!items.length) return "DRAFT";
	if (items.every((item) => item.status === "CANCELLED")) return "CANCELLED";
	if (
		items.every((item) =>
			["DISPENSED", "CANCELLED"].includes(item.status) ||
			item.quantityDispensed >= item.quantityPrescribed,
		)
	) {
		return "DISPENSED";
	}
	if (items.some((item) => item.quantityDispensed > 0 || item.status === "PARTIAL")) {
		return "PARTIAL";
	}
	return "ACTIVE";
};

const deriveItemStatus = (quantityPrescribed, quantityDispensed, currentStatus) => {
	if (currentStatus === "CANCELLED") return "CANCELLED";
	if (quantityDispensed <= 0) return "PENDING";
	if (quantityDispensed >= quantityPrescribed) return "DISPENSED";
	return "PARTIAL";
};

const generatePrescriptionNumber = async () => {
	const year = new Date().getFullYear();
	const count = await prisma.prescription.count({
		where: { prescriptionNumber: { startsWith: `RX-${year}-` } },
	});
	return `RX-${year}-${String(count + 1).padStart(5, "0")}`;
};

const loadInventoryItems = async (items) => {
	const ids = [...new Set(items.map((item) => item.inventoryItemId).filter(Boolean))];
	if (!ids.length) return new Map();

	const inventoryItems = await prisma.inventoryItem.findMany({
		where: { id: { in: ids } },
		select: {
			id: true,
			name: true,
			genericName: true,
			unit: true,
			currentStock: true,
			sellingPrice: true,
		},
	});

	const map = new Map(inventoryItems.map((item) => [item.id, item]));
	for (const id of ids) {
		if (!map.has(id)) {
			const err = new Error(`Inventory item not found: ${id}`);
			err.statusCode = 404;
			throw err;
		}
	}
	return map;
};

const normalizePrescriptionItems = async (items) => {
	const inventoryMap = await loadInventoryItems(items);

	return items.map((item) => {
		const inventoryItem = item.inventoryItemId
			? inventoryMap.get(item.inventoryItemId)
			: null;
		const drugName = cleanText(item.drugName) || inventoryItem?.name || null;
		if (!drugName) {
			const err = new Error("Each prescription item must have a drug name or inventory medicine selected");
			err.statusCode = 422;
			throw err;
		}

		return {
			inventoryItemId: item.inventoryItemId || null,
			drugName,
			genericName: cleanText(item.genericName) || inventoryItem?.genericName || null,
			dose: cleanText(item.dose),
			frequency: cleanText(item.frequency),
			duration: cleanText(item.duration),
			route: cleanText(item.route),
			instructions: cleanText(item.instructions),
			quantityPrescribed: Number(item.quantityPrescribed),
		};
	});
};

const ensureEncounterMatchesPatient = async (encounterId, patientId) => {
	const encounter = await prisma.encounter.findUniqueOrThrow({
		where: { id: encounterId },
		select: { id: true, patientId: true, doctorId: true },
	});
	if (encounter.patientId !== patientId) {
		const err = new Error("Encounter does not belong to the selected patient");
		err.statusCode = 400;
		throw err;
	}
	return encounter;
};

const getPrescriptions = async (query) => {
	const { page, limit, skip } = paginate(query);
	const { search, status, patientId, encounterId, prescribedById } = query;

	const where = {
		...(status && { status }),
		...(patientId && { patientId }),
		...(encounterId && { encounterId }),
		...(prescribedById && { prescribedById }),
		...(search && {
			OR: [
				{ prescriptionNumber: { contains: search, mode: "insensitive" } },
				{
					patient: {
						is: { fullName: { contains: search, mode: "insensitive" } },
					},
				},
				{
					patient: {
						is: { patientCode: { contains: search, mode: "insensitive" } },
					},
				},
				{ items: { some: { drugName: { contains: search, mode: "insensitive" } } } },
			],
		}),
	};

	const [data, total] = await Promise.all([
		prisma.prescription.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
			include: prescriptionInclude,
		}),
		prisma.prescription.count({ where }),
	]);

	return { data, meta: paginateMeta(total, page, limit) };
};

const getPrescriptionById = (id) =>
	prisma.prescription.findUniqueOrThrow({
		where: { id },
		include: prescriptionInclude,
	});

const createPrescription = async (data, prescribedById) => {
	await prisma.patient.findUniqueOrThrow({ where: { id: data.patientId } });
	await ensureEncounterMatchesPatient(data.encounterId, data.patientId);

	const items = await normalizePrescriptionItems(data.items);
	const prescriptionNumber = await generatePrescriptionNumber();

	return prisma.prescription.create({
		data: {
			prescriptionNumber,
			patientId: data.patientId,
			encounterId: data.encounterId,
			prescribedById,
			notes: cleanText(data.notes),
			status: derivePrescriptionStatusFromItems(items.map((item) => ({ ...item, quantityDispensed: 0, status: "PENDING" }))),
			items: { create: items },
		},
		include: prescriptionInclude,
	});
};

const updatePrescription = async (id, data) => {
	const existing = await prisma.prescription.findUniqueOrThrow({
		where: { id },
		include: { items: true },
	});

	if (["DISPENSED", "CANCELLED"].includes(existing.status)) {
		const err = new Error("Dispensed or cancelled prescriptions cannot be edited");
		err.statusCode = 400;
		throw err;
	}

	if (data.items && existing.items.some((item) => item.quantityDispensed > 0)) {
		const err = new Error("Prescription items cannot be replaced after dispensing has started");
		err.statusCode = 400;
		throw err;
	}

	const normalizedItems = data.items
		? await normalizePrescriptionItems(data.items)
		: null;

	const updated = await prisma.$transaction(async (tx) => {
		if (normalizedItems) {
			await tx.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
		}

		const prescription = await tx.prescription.update({
			where: { id },
			data: {
				notes: Object.prototype.hasOwnProperty.call(data, "notes")
					? cleanText(data.notes)
					: undefined,
				items: normalizedItems ? { create: normalizedItems } : undefined,
			},
			include: prescriptionInclude,
		});

		const nextStatus = derivePrescriptionStatusFromItems(prescription.items);
		if (nextStatus !== prescription.status) {
			return tx.prescription.update({
				where: { id },
				data: {
					status: nextStatus,
					dispensedAt: nextStatus === "DISPENSED" ? new Date() : null,
				},
				include: prescriptionInclude,
			});
		}

		return prescription;
	});

	return updated;
};

const dispensePrescription = async (id, data, dispensedById) => {
	return prisma.$transaction(async (tx) => {
		const prescription = await tx.prescription.findUniqueOrThrow({
			where: { id },
			include: {
				items: true,
			},
		});

		if (prescription.status === "CANCELLED") {
			const err = new Error("Cancelled prescriptions cannot be dispensed");
			err.statusCode = 400;
			throw err;
		}

		for (const requestItem of data.items) {
			const item = prescription.items.find(
				entry => entry.id === requestItem.prescriptionItemId,
			);
			if (!item) {
				const err = new Error(`Prescription item not found: ${requestItem.prescriptionItemId}`);
				err.statusCode = 404;
				throw err;
			}

			if (item.status === "CANCELLED") {
				const err = new Error(`Cancelled item cannot be dispensed: ${item.drugName}`);
				err.statusCode = 400;
				throw err;
			}

			if (!item.inventoryItemId) {
				const err = new Error(`Inventory medicine not linked for item: ${item.drugName}`);
				err.statusCode = 400;
				throw err;
			}

			const remaining = item.quantityPrescribed - item.quantityDispensed;
			if (requestItem.quantity > remaining) {
				const err = new Error(`Dispense quantity exceeds remaining quantity for ${item.drugName}`);
				err.statusCode = 400;
				throw err;
			}

			const inventoryItem = await tx.inventoryItem.findUniqueOrThrow({
				where: { id: item.inventoryItemId },
				select: { id: true, currentStock: true },
			});

			if (inventoryItem.currentStock < requestItem.quantity) {
				const err = new Error(`Insufficient stock for ${item.drugName}`);
				err.statusCode = 400;
				throw err;
			}

			const newStock = inventoryItem.currentStock - requestItem.quantity;
			const newQuantityDispensed = item.quantityDispensed + requestItem.quantity;
			const nextItemStatus = deriveItemStatus(
				item.quantityPrescribed,
				newQuantityDispensed,
				item.status,
			);

			await tx.inventoryItem.update({
				where: { id: inventoryItem.id },
				data: { currentStock: newStock },
			});

			await tx.stockTransaction.create({
				data: {
					itemId: inventoryItem.id,
					type: "DISPENSED",
					quantity: requestItem.quantity,
					balanceAfter: newStock,
					reference: prescription.prescriptionNumber,
					notes: cleanText(requestItem.notes) || `Dispensed from ${prescription.prescriptionNumber}`,
				},
			});

			await tx.dispenseRecord.create({
				data: {
					prescriptionItemId: item.id,
					inventoryItemId: inventoryItem.id,
					dispensedById,
					quantity: requestItem.quantity,
					notes: cleanText(requestItem.notes),
				},
			});

			await tx.prescriptionItem.update({
				where: { id: item.id },
				data: {
					quantityDispensed: newQuantityDispensed,
					status: nextItemStatus,
				},
			});
		}

		const refreshed = await tx.prescription.findUniqueOrThrow({
			where: { id },
			include: { items: true },
		});
		const nextStatus = derivePrescriptionStatusFromItems(refreshed.items);

		await tx.prescription.update({
			where: { id },
			data: {
				status: nextStatus,
				dispensedAt: nextStatus === "DISPENSED" ? new Date() : refreshed.dispensedAt,
			},
		});

		return tx.prescription.findUniqueOrThrow({
			where: { id },
			include: prescriptionInclude,
		});
	});
};

module.exports = {
	getPrescriptions,
	getPrescriptionById,
	createPrescription,
	updatePrescription,
	dispensePrescription,
};
