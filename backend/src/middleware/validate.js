// Zod request validation middleware factory.
// Default: validates req.body. Pass source = "query" or "params" to validate those.
const { sendError } = require("../utils/apiResponse");

const validate =
	(schema, source = "body") =>
	(req, res, next) => {
		const result = schema.safeParse(req[source]);
		if (!result.success) {
			const errors = result.error.errors.map((e) => ({
				field: e.path.join("."),
				message: e.message,
			}));
			return sendError(res, "Validation failed", 422, errors);
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
