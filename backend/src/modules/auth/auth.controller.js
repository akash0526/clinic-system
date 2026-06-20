const { z } = require("zod");
const authService = require("./auth.service");
const env = require("../../config/env");
const {
	sendSuccess,
	sendCreated,
	sendError,
} = require("../../utils/apiResponse");
const { createAuditLog } = require("../../middleware/audit");
const validate = require("../../middleware/validate");

// ─── Cookie options ───────────────────────────────────────
// httpOnly  -> JavaScript can't read it (protects against XSS token theft)
// secure    -> only sent over HTTPS (true in production)
// sameSite  -> "lax" works for same-site dev; use "none" only if frontend &
//              backend are on different domains over HTTPS.
const COOKIE_NAME = "clinic_token";
const cookieOptions = {
	httpOnly: true,
	secure: env.COOKIE_SECURE, // false in dev, true in production
	sameSite: "lax",
	maxAge: 24 * 60 * 60 * 1000, // 1 day (match JWT_EXPIRES_IN)
	path: "/",
};

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
 * Public: authenticate, set httpOnly cookie, return user
 */
const login = [
	validate(loginSchema),
	async (req, res, next) => {
		try {
			const { user, token } = await authService.loginUser(req.body);

			// Set the JWT as a secure, httpOnly cookie.
			res.cookie(COOKIE_NAME, token, cookieOptions);

			await createAuditLog({
				userId: user.id,
				userEmail: user.email,
				action: "LOGIN",
				tableName: "users",
				recordId: user.id,
				ipAddress: req.ip,
				userAgent: req.headers["user-agent"],
			});

			// Still return the token in the body too, so the transition is smooth
			// and any older client keeps working. The cookie is the secure path.
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
 * Clears the auth cookie and logs the event server-side
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

	// Clear the cookie (must use same path/options it was set with).
	res.clearCookie(COOKIE_NAME, { path: "/" });

	return sendSuccess(res, null, "Logged out successfully");
};

module.exports = { register, login, me, logout };
