// Global error handler middleware
// Must be added LAST in Express app

const { Prisma } = require("@prisma/client");

const errorHandler = (err, req, res, next) => {
	console.error("Error:", err);

	// Prisma: Record not found
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2025") {
			return res
				.status(404)
				.json({ success: false, message: "Record not found" });
		}
		if (err.code === "P2002") {
			const field = err.meta?.target?.[0] || "field";
			return res
				.status(409)
				.json({ success: false, message: `${field} already exists` });
		}
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
	const message =
		process.env.NODE_ENV === "production"
			? "Internal server error"
			: err.message;

	return res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
