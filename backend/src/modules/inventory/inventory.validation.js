// Zod validation schemas for the inventory module.
const { z } = require("zod");

// Accept numbers OR numeric strings (forms often send strings) and coerce.
const numeric = (msg) =>
	z.coerce.number({ invalid_type_error: msg }).nonnegative(msg);

const createItemSchema = z.object({
	name: z.string().min(1, "Name is required"),
	genericName: z.string().optional(),
	category: z.enum(["MEDICINE", "CONSUMABLE", "EQUIPMENT"], {
		errorMap: () => ({
			message: "category must be MEDICINE, CONSUMABLE or EQUIPMENT",
		}),
	}),
	unit: z.string().min(1, "Unit is required"),
	purchasePrice: numeric("purchasePrice must be a non-negative number"),
	sellingPrice: numeric("sellingPrice must be a non-negative number"),
	currentStock: z.coerce.number().int().nonnegative().optional().default(0),
	minimumStock: z.coerce.number().int().nonnegative().optional().default(10),
	manufacturer: z.string().optional(),
	batchNumber: z.string().optional(),
});

const updateItemSchema = createItemSchema.partial();

const stockMovementSchema = z.object({
	type: z.enum(["PURCHASE", "DISPENSED", "ADJUSTMENT", "EXPIRED", "RETURNED"]),
	quantity: z.coerce
		.number()
		.int()
		.positive("quantity must be a positive integer"),
	notes: z.string().optional(),
	reference: z.string().optional(),
});

module.exports = { createItemSchema, updateItemSchema, stockMovementSchema };
