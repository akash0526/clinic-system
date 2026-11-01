// Global error handler middleware
// Must be added LAST in Express app
//
// NOTE: Prisma errors are matched by `err.name` (not `instanceof`) so this
// module behaves identically whether or not `prisma generate` has run, and
// stays robust across Prisma client versions. Prisma sets:
//   - "PrismaClientKnownRequestError"  (has .code: P2002/P2003/P2025/...)
//   - "PrismaClientValidationError"    (bad cuid in :id, unknown enum in a
//                                       where clause, invalid Date, ...)

const errorHandler = (err, req, res, next) => {
	console.error("Error:", err);

	const isProd = process.env.NODE_ENV === "production";

	// Prisma known request errors (constraint violations etc.)
	if (err.name === "PrismaClientKnownRequestError") {
		// Record not found (findUniqueOrThrow / update / delete on missing row)
		if (err.code === "P2025") {
			return res
				.status(404)
				.json({ success: false, message: "Record not found" });
		}
		// Unique constraint violation
		if (err.code === "P2002") {
			const field = err.meta?.target?.[0] || "field";
			return res
				.status(409)
				.json({ success: false, message: `${field} already exists` });
		}
		// Foreign-key violation: the client referenced a row that does not exist
		// (e.g. unknown patientId/doctorId/testId in a POST body). This is a
		// client input problem → 400, never a 500.
		if (err.code === "P2003") {
			const field = err.meta?.target?.[0];
			return res.status(400).json({
				success: false,
				message: field
					? `Related record not found: ${field}`
					: "Related record not found",
			});
		}
		// Any other known Prisma request error
		return res.status(400).json({
			success: false,
			message: isProd ? "Database request failed" : err.message,
		});
	}

	// Prisma validation errors: malformed cuid in a path param, unknown enum
	// value in a query filter, invalid Date value, etc. → 400, never a 500.
	if (err.name === "PrismaClientValidationError") {
		return res.status(400).json({
			success: false,
			message: isProd ? "Invalid request parameters" : err.message,
		});
	}

	// JWT errors
	if (err.name === "JsonWebTokenError") {
		return res.status(401).json({ success: false, message: "Invalid token" });
	}
	if (err.name === "TokenExpiredError") {
		return res.status(401).json({ success: false, message: "Token expired" });
	}

	// Zod validation errors (caught in middleware, but fallback here)
	if (err.name === "ZodError") {
		return res.status(422).json({
			success: false,
			message: "Validation failed",
			errors: err.errors.map((e) => ({
				field: e.path.join("."),
				message: e.message,
			})),
		});
	}

	// Default 500
	const statusCode = err.statusCode || 500;
	const message = isProd ? "Internal server error" : err.message;

	return res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
