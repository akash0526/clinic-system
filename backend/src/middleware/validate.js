// Zod request validation middleware factory.
// Default: validates req.body. Pass source = "query" or "params" to validate those.
// Pass statusCode (default 422) to choose the error status for failed validation
// (some routes intentionally return 400).
const { sendError } = require("../utils/apiResponse");

const validate =
	(schema, source = "body", statusCode = 422) =>
	(req, res, next) => {
		const result = schema.safeParse(req[source]);
		if (!result.success) {
			const errors = result.error.errors.map((e) => ({
				field: e.path.join("."),
				message: e.message,
			}));
			return sendError(res, "Validation failed", statusCode, errors);
		}
		// Use parsed/coerced data. (req.query can be read-only in some setups,
		// so we only overwrite body/params safely; for query we attach validatedQuery.)
		if (source === "query") {
			req.validatedQuery = result.data;
		} else {
			req[source] = result.data;
		}
		next();
	};

module.exports = validate;
