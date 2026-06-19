const { z } = require("zod");

const optionalText = () => z.string().trim().min(1).optional().or(z.literal(""));

const prescriptionItemSchema = z.object({
	inventoryItemId: z.string().cuid().optional(),
	drugName: optionalText(),
	genericName: optionalText(),
	dose: optionalText(),
	frequency: optionalText(),
	duration: optionalText(),
	route: optionalText(),
	instructions: optionalText(),
	quantityPrescribed: z.number().int().positive(),
});

const createPrescriptionSchema = z.object({
	patientId: z.string().cuid(),
	encounterId: z.string().cuid(),
	notes: optionalText(),
	items: z.array(prescriptionItemSchema).min(1, "At least one medicine is required"),
});

const updatePrescriptionSchema = z.object({
	notes: optionalText(),
	items: z.array(prescriptionItemSchema).min(1).optional(),
});

const dispenseItemSchema = z.object({
	prescriptionItemId: z.string().cuid(),
	quantity: z.number().int().positive(),
	notes: optionalText(),
});

const dispensePrescriptionSchema = z.object({
	items: z.array(dispenseItemSchema).min(1, "At least one item must be dispensed"),
});

module.exports = {
	createPrescriptionSchema,
	updatePrescriptionSchema,
	dispensePrescriptionSchema,
};
