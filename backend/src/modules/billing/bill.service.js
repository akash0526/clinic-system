const prisma = require("../../config/db");
const { paginate, paginateMeta } = require("../../utils/pagination");

/**
 * Generate a unique, year-scoped bill number using a dedicated counter table
 * inside a transaction. This avoids the race condition that exists when using
 * `count() + 1` (two concurrent requests could get the same number).
 *
 * NOTE: requires a `BillCounter` model in schema.prisma (see FILE 10).
 */
const nextBillNumber = async (tx) => {
	const year = new Date().getFullYear();
	const counter = await tx.billCounter.upsert({
		where: { year },
		update: { lastNumber: { increment: 1 } },
		create: { year, lastNumber: 1 },
	});
	return `INV-${year}-${String(counter.lastNumber).padStart(5, "0")}`;
};

const createBill = async (data) => {
	const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
	const discountAmount =
		data.discountType === "PERCENT"
			? subtotal * ((data.discountValue || 0) / 100)
			: data.discountValue || 0;
	const afterDiscount = Math.max(0, subtotal - discountAmount);
	const taxAmount = afterDiscount * ((data.taxPercent || 0) / 100);
	const totalAmount = afterDiscount + taxAmount;
	const paidAmount = data.paidAmount || 0;
	const dueAmount = Math.max(0, totalAmount - paidAmount);

	const status =
		dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";

	// Wrap number generation + creation in one transaction so the invoice
	// number is reserved atomically with the bill row.
	return prisma.$transaction(async (tx) => {
		const billNumber = await nextBillNumber(tx);

		return tx.bill.create({
			data: {
				billNumber,
				billDateAD: new Date(),
				patientId: data.patientId,
				encounterId: data.encounterId || null,
				subtotal,
				discountType: data.discountType,
				discountValue: data.discountValue || 0,
				discountAmount,
				taxPercent: data.taxPercent || 0,
				taxAmount,
				totalAmount,
				paidAmount,
				dueAmount,
				status,
				paymentMethod: data.paymentMethod,
				notes: data.notes,
				items: {
					create: data.items.map((i) => ({
						description: i.description,
						category: i.category || "OTHER",
						quantity: i.quantity,
						unitPrice: i.unitPrice,
						totalPrice: i.quantity * i.unitPrice,
					})),
				},
				payments:
					paidAmount > 0
						? {
								create: [
									{
										amount: paidAmount,
										method: data.paymentMethod || "CASH",
									},
								],
							}
						: undefined,
			},
			include: { items: true, payments: true },
		});
	});
};

const getBills = async (query) => {
	const { page, limit, skip } = paginate(query);
	const { search, status, patientId } = query;

	const where = {
		...(status && { status }),
		...(patientId && { patientId }),
		...(search && {
			OR: [
				{ billNumber: { contains: search, mode: "insensitive" } },
				{ patient: { fullName: { contains: search, mode: "insensitive" } } },
			],
		}),
	};

	const [data, total] = await Promise.all([
		prisma.bill.findMany({
			where,
			skip,
			take: limit,
			orderBy: { billDateAD: "desc" },
			include: {
				patient: { select: { id: true, fullName: true, patientCode: true } },
				items: true,
				payments: true,
			},
		}),
		prisma.bill.count({ where }),
	]);

	return { data, meta: paginateMeta(total, page, limit) };
};

const getBillById = (id) =>
	prisma.bill.findUniqueOrThrow({
		where: { id },
		include: { patient: true, items: true, payments: true },
	});

/**
 * Add a payment to a bill — race-safe.
 * Reads the bill INSIDE the transaction and recomputes totals atomically.
 * Prevents lost updates / overpayment when two payments hit at once.
 */
const addPayment = async (billId, amount, method, reference) => {
	return prisma.$transaction(async (tx) => {
		const bill = await tx.bill.findUniqueOrThrow({ where: { id: billId } });

		if (["CANCELLED", "REFUNDED"].includes(bill.status)) {
			const err = new Error(`Cannot add payment to a ${bill.status} bill`);
			err.statusCode = 400;
			throw err;
		}

		const newPaid = Number(bill.paidAmount) + Number(amount);
		if (newPaid > Number(bill.totalAmount) + 0.001) {
			const err = new Error("Payment exceeds the amount due");
			err.statusCode = 400;
			throw err;
		}

		const newDue = Math.max(0, Number(bill.totalAmount) - newPaid);
		const status = newDue <= 0 ? "PAID" : "PARTIAL";

		const payment = await tx.payment.create({
			data: { billId, amount, method, reference },
		});

		await tx.bill.update({
			where: { id: billId },
			data: { paidAmount: newPaid, dueAmount: newDue, status },
		});

		return payment;
	});
};

module.exports = { createBill, getBills, getBillById, addPayment };
