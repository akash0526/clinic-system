// Role-Based Access Control middleware
// Usage: authorize('ADMIN', 'DOCTOR') — pass allowed roles

const { sendError } = require("../utils/apiResponse");

/**
 * Restrict route to specific roles
 * @param {...string} roles - Allowed roles (ADMIN, DOCTOR, RECEPTIONIST, LAB_TECH)
 */
const authorize =
	(...roles) =>
	(req, res, next) => {
		if (!req.user) {
			return sendError(res, "Authentication required", 401);
		}
		if (!roles.includes(req.user.role)) {
			return sendError(
				res,
				`Access denied. Required role: ${roles.join(" or ")}`,
				403,
			);
		}
		next();
	};

// Convenience shortcuts
const isAdmin = authorize("ADMIN");
const isDoctor = authorize("ADMIN", "DOCTOR");
const isStaff = authorize("ADMIN", "DOCTOR", "RECEPTIONIST");
const isLabTech = authorize("ADMIN", "LAB_TECH");

module.exports = { authorize, isAdmin, isDoctor, isStaff, isLabTech };
