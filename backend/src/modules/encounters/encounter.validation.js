// Zod validation schemas for the encounters module.
const { z } = require("zod");
const { DATE_ONLY_REGEX } = require("../../utils/date");

const encounterSchema = z.object({
	patientId: z.string().cuid(),
	appointmentId: z.string().cuid().optional(),
	weightKg: z.number().optional(),
	heightCm: z.number().optional(),
	temperature: z.number().optional(),
	pulseRate: z.number().int().optional(),
	respiratoryRate: z.number().int().optional(),
	bloodPressureSystolic: z.number().int().optional(),
	bloodPressureDiastolic: z.number().int().optional(),
	oxygenSaturation: z.number().optional(),
	bloodSugar: z.number().optional(),
	subjective: z.string().optional(),
	objective: z.string().optional(),
	assessment: z.string().optional(),
	plan: z.string().optional(),
	diagnoses: z
		.array(z.object({ code: z.string(), description: z.string() }))
		.optional(),
	followUpDateAD: z
		.string()
		.regex(DATE_ONLY_REGEX, "Invalid date YYYY-MM-DD")
		.optional()
		.or(z.literal("")),
	followUpNotes: z.string().optional(),
});

// PUT update: all fields optional so a partial update is valid.
const updateEncounterSchema = encounterSchema.partial();

module.exports = { encounterSchema, updateEncounterSchema };
