// Standard API response helpers
// Every response follows { success, data, message, meta } shape

const sendSuccess = (
	res,
	data,
	message = "Success",
	statusCode = 200,
	meta = null,
) => {
	const response = { success: true, message, data };
	if (meta) response.meta = meta;
	return res.status(statusCode).json(response);
};

const sendError = (
	res,
	message = "An error occurred",
	statusCode = 400,
	errors = null,
) => {
	const response = { success: false, message };
	if (errors) response.errors = errors;
	return res.status(statusCode).json(response);
};

const sendCreated = (res, data, message = "Created successfully") =>
	sendSuccess(res, data, message, 201);

module.exports = { sendSuccess, sendError, sendCreated };
