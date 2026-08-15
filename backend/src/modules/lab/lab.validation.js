// Zod validation schemas for the lab module.
const { z } = require("zod");

// Ordering a lab test: patient and test are required; encounter is optional.
const orderLabResultSchema = z.object({
	patientId: z.string().cuid(),
	testId: z.string().cuid(),
	encounterId: z.string().cuid().optional().nullable(),
});

// Entering/updating a result. resultData is a free-form JSON payload.
const updateLabResultSchema = z.object({
	resultData: z.unknown().optional(),
	interpretation: z.string().optional(),
	notes: z.string().optional(),
	status: z
		.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
		.optional(),
});

module.exports = { orderLabResultSchema, updateLabResultSchema };
