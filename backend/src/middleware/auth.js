// JWT authentication middleware
// Reads the token from the httpOnly cookie first, then falls back to the
// Authorization: Bearer header. Attaches req.user.

const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const env = require("../config/env");
const { sendError } = require("../utils/apiResponse");

const authenticate = async (req, res, next) => {
	try {
		// 1) Prefer the secure httpOnly cookie.
		let token = req.cookies?.clinic_token;

		// 2) Fall back to the Authorization header (Bearer <token>).
		if (!token) {
			const authHeader = req.headers.authorization;
			if (authHeader?.startsWith("Bearer ")) {
				token = authHeader.split(" ")[1];
			}
		}

		if (!token) {
			return sendError(res, "Authentication required", 401);
		}

		const decoded = jwt.verify(token, env.JWT_SECRET);

		// Fetch fresh user (ensures deactivated users are blocked)
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: {
				id: true,
				email: true,
				role: true,
				fullName: true,
				isActive: true,
				phone: true,
			},
		});

		if (!user || !user.isActive) {
			return sendError(res, "Account not found or deactivated", 401);
		}

		req.user = user;
		next();
	} catch (err) {
		next(err); // Pass JWT errors to errorHandler
	}
};

module.exports = authenticate;
