// Audit logging middleware
// Automatically logs CREATE/UPDATE/DELETE actions

const prisma = require("../config/db");

/**
 * Creates an audit log entry
 * Can be called directly in controllers for granular control
 */
const createAuditLog = async ({
	userId,
	userEmail,
	action,
	tableName,
	recordId,
	oldValues,
	newValues,
	ipAddress,
	userAgent,
	description,
}) => {
	try {
		await prisma.auditLog.create({
			data: {
				userId,
				userEmail,
				action,
				tableName,
				recordId,
				oldValues,
				newValues,
				ipAddress,
				userAgent,
				description,
			},
		});
	} catch (err) {
		// Never let audit logging break the main flow
		console.error("Audit log error:", err);
	}
};

/**
 * Middleware factory for auto audit logging
 */
const auditMiddleware = (tableName, action) => async (req, res, next) => {
	const originalJson = res.json.bind(res);

	res.json = async (body) => {
		if (body?.success && req.user) {
			await createAuditLog({
				userId: req.user.id,
				userEmail: req.user.email,
				action,
				tableName,
				recordId: body?.data?.id || req.params.id,
				newValues: req.method !== "GET" ? req.body : undefined,
				ipAddress: req.ip,
				userAgent: req.headers["user-agent"],
			});
		}
		return originalJson(body);
	};

	next();
};

module.exports = { createAuditLog, auditMiddleware };
