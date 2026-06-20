// Zod validation schemas for the billing module.
const { z } = require("zod");

// Coerce so the schema accepts numbers OR numeric strings ("100" -> 100),
// since HTML form inputs commonly send strings.
const billItemSchema = z.object({
	description: z.string().min(1, "Item description is required"),
	category: z.string().optional(),
	quantity: z.coerce
		.number()
		.int()
		.positive("Quantity must be a positive integer"),
	unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
});

const createBillSchema = z
	.object({
		patientId: z.string().min(1, "patientId is required"),
		encounterId: z.string().optional().nullable(),
		items: z.array(billItemSchema).min(1, "At least one item is required"),
		discountType: z.enum(["PERCENT", "FIXED"]).optional(),
		discountValue: z.coerce.number().nonnegative().optional().default(0),
		taxPercent: z.coerce.number().min(0).max(100).optional().default(0),
		paidAmount: z.coerce.number().nonnegative().optional().default(0),
		paymentMethod: z
			.enum(["CASH", "ESEWA", "KHALTI", "BANK_TRANSFER", "INSURANCE", "OTHER"])
			.optional(),
		notes: z.string().optional(),
	})
	.refine((d) => d.discountType !== "PERCENT" || d.discountValue <= 100, {
		message: "Percentage discount cannot exceed 100",
		path: ["discountValue"],
	});

const addPaymentSchema = z.object({
	amount: z.coerce.number().positive("Payment amount must be positive"),
	method: z
		.enum(["CASH", "ESEWA", "KHALTI", "BANK_TRANSFER", "INSURANCE", "OTHER"])
		.optional()
		.default("CASH"),
	reference: z.string().optional(),
});

module.exports = { createBillSchema, addPaymentSchema };
