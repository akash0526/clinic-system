// JWT authentication middleware
// Verifies Bearer token and attaches req.user

const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { sendError } = require("../utils/apiResponse");

const authenticate = async (req, res, next) => {
	try {
		// Extract token from Authorization: Bearer <token>
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			return sendError(res, "Authentication required", 401);
		}

		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
