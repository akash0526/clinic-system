// FIXED: Was using ES module `export` syntax — now CommonJS
const { z } = require("zod");

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const bsDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createPatientSchema = z.object({
	fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
	fullNameNe: z.string().max(100).optional(),
	gender: z.enum(["MALE", "FEMALE", "OTHER"]),
	bloodGroup: z.enum(BLOOD_GROUPS).optional().or(z.literal("")),

	dobBS: z.string().regex(bsDateRegex, "Invalid BS date YYYY-MM-DD").optional(),
	dobAD: z.string().optional(),

	phone: z
		.string()
		.regex(/^[0-9]{10}$/, "10-digit phone required")
		.optional()
		.or(z.literal("")),
	phone2: z.string().optional().or(z.literal("")),
	email: z.string().email().optional().or(z.literal("")),

	emergencyContact: z.string().optional(),
	emergencyContactPhone: z.string().optional(),
	emergencyContactRel: z.string().optional(),

	province: z.string().optional(),
	district: z.string().optional(),
	municipality: z.string().optional(),
	ward: z.string().optional(),
	tole: z.string().optional(),
	houseNo: z.string().optional(),

	allergies: z.array(z.string()).default([]),
	chronicConditions: z.array(z.string()).default([]),
	notes: z.string().optional(),

	insuranceProvider: z.string().optional(),
	insurancePolicyNo: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

module.exports = { createPatientSchema, updatePatientSchema };
