const prisma = require("../../config/db");
const { todayBS } = require("../../utils/bsDate");
const { paginate, paginateMeta } = require("../../utils/pagination");

const generateBillNumber = async () => {
	const count = await prisma.bill.count();
	const { BikramSambat } = require("bikram-sambat");
	const year = BikramSambat.fromAD(new Date()).year;
	return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
};

const createBill = async (data) => {
	const billNumber = await generateBillNumber();
	const billDateBS = todayBS();

	// Calculate totals
	const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
	const discountAmount =
		data.discountType === "PERCENT"
			? subtotal * (data.discountValue / 100)
			: data.discountValue || 0;
	const afterDiscount = subtotal - discountAmount;
	const taxAmount = afterDiscount * ((data.taxPercent || 0) / 100);
	const totalAmount = afterDiscount + taxAmount;
	const dueAmount = totalAmount - (data.paidAmount || 0);

	const status =
		dueAmount <= 0 ? "PAID" : data.paidAmount > 0 ? "PARTIAL" : "PENDING";

	return prisma.bill.create({
		data: {
			billNumber,
			billDateBS,
			billDateAD: new Date(),
			patientId: data.patientId,
			encounterId: data.encounterId,
			subtotal,
			discountType: data.discountType,
			discountValue: data.discountValue || 0,
			discountAmount,
			taxPercent: data.taxPercent || 0,
			taxAmount,
			totalAmount,
			paidAmount: data.paidAmount || 0,
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
				data.paidAmount > 0
					? {
							create: [
								{
									amount: data.paidAmount,
									method: data.paymentMethod || "CASH",
								},
							],
						}
					: undefined,
		},
		include: { items: true, payments: true },
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
		include: {
			patient: true,
			items: true,
			payments: true,
		},
	});

const addPayment = async (billId, amount, method, reference) => {
	const bill = await prisma.bill.findUniqueOrThrow({ where: { id: billId } });
	const newPaid = Number(bill.paidAmount) + Number(amount);
	const newDue = Number(bill.totalAmount) - newPaid;
	const status = newDue <= 0 ? "PAID" : "PARTIAL";

	const [payment] = await prisma.$transaction([
		prisma.payment.create({ data: { billId, amount, method, reference } }),
		prisma.bill.update({
			where: { id: billId },
			data: { paidAmount: newPaid, dueAmount: Math.max(0, newDue), status },
		}),
	]);
	return payment;
};

module.exports = { createBill, getBills, getBillById, addPayment };
