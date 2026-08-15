// Zod validation schemas for the appointments module.
const { z } = require("zod");
const { DATE_ONLY_REGEX } = require("../../utils/date");

const createAppointmentSchema = z.object({
	patientId: z.string().cuid(),
	doctorId: z.string().cuid(),
	appointmentDateAD: z.string().regex(DATE_ONLY_REGEX, "Invalid date YYYY-MM-DD"),
	appointmentTime: z.string(),
	type: z.string().default("OPD"),
	chiefComplaint: z.string().optional(),
	notes: z.string().optional(),
	duration: z.number().int().default(15),
});

const updateStatusSchema = z.object({
	status: z.enum([
		"SCHEDULED",
		"CONFIRMED",
		"IN_PROGRESS",
		"COMPLETED",
		"CANCELLED",
		"NO_SHOW",
	]),
});

module.exports = { createAppointmentSchema, updateStatusSchema };
