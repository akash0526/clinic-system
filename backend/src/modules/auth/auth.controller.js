const { z } = require("zod");
const authService = require("./auth.service");
const {
	sendSuccess,
	sendCreated,
	sendError,
} = require("../../utils/apiResponse");
const { createAuditLog } = require("../../middleware/audit");
const validate = require("../../middleware/validate");

// ─── Validation Schemas ────────────────────────────────────

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8, "Password must be at least 8 characters"),
	fullName: z.string().min(2),
	fullNameNe: z.string().optional(),
	role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "LAB_TECH"]),
	phone: z.string().optional(),
	licenseNumber: z.string().optional(),
	specialization: z.string().optional(),
});

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

// ─── Controllers ──────────────────────────────────────────

/**
 * POST /api/auth/register
 * Admin-only: create new user accounts
 */
const register = [
	validate(registerSchema),
	async (req, res, next) => {
		try {
			const user = await authService.registerUser(req.body);

			await createAuditLog({
				userId: req.user?.id,
				userEmail: req.user?.email,
				action: "CREATE",
				tableName: "users",
				recordId: user.id,
				newValues: { email: user.email, role: user.role },
				ipAddress: req.ip,
			});

			return sendCreated(res, user, "User created successfully");
		} catch (err) {
			next(err);
		}
	},
];

/**
 * POST /api/auth/login
 * Public: authenticate and receive JWT
 */
const login = [
	validate(loginSchema),
	async (req, res, next) => {
		try {
			const { user, token } = await authService.loginUser(req.body);

			await createAuditLog({
				userId: user.id,
				userEmail: user.email,
				action: "LOGIN",
				tableName: "users",
				recordId: user.id,
				ipAddress: req.ip,
				userAgent: req.headers["user-agent"],
			});

			return sendSuccess(res, { user, token }, "Login successful");
		} catch (err) {
			next(err);
		}
	},
];

/**
 * GET /api/auth/me
 * Authenticated: get current user profile
 */
const me = async (req, res) => {
	return sendSuccess(res, req.user, "Profile fetched");
};

/**
 * POST /api/auth/logout
 * Client should discard token; log the event server-side
 */
const logout = async (req, res) => {
	await createAuditLog({
		userId: req.user.id,
		userEmail: req.user.email,
		action: "LOGOUT",
		tableName: "users",
		recordId: req.user.id,
		ipAddress: req.ip,
	});
	return sendSuccess(res, null, "Logged out successfully");
};

module.exports = { register, login, me, logout };
