// Zod validation schemas for the users module.
const { z } = require("zod");

// Shared user shape (POST create).
const userSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8, "Password must be at least 8 characters").optional(),
	fullName: z.string().min(2, "Name must be at least 2 characters"),
	fullNameNe: z.string().optional(),
	role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "LAB_TECH"]),
	phone: z.string().optional(),
	licenseNumber: z.string().optional(),
	specialization: z.string().optional(),
	isActive: z.boolean().optional(),
});

// PUT update: every field optional, and UNKNOWN KEYS ARE REJECTED (.strict()).
// This is the strict field allowlist — direct credential fields such as
// `passwordHash` are not part of the schema and will fail validation with a
// clean 4xx instead of being written to the database. Password changes go
// through the `password` field, which the route hashes server-side.
const updateUserSchema = userSchema.partial().strict();

module.exports = { userSchema, updateUserSchema };
