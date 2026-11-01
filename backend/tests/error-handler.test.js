// Unit tests for the global error handler's status-code mapping.
// No database required — errors are plain objects with the same `name`/`code`
// shape Prisma produces, which is exactly how the handler matches them.
const test = require("node:test");
const assert = require("node:assert/strict");

const errorHandler = require("../src/middleware/errorHandler");

// Minimal mock res that captures status + json body.
const mockRes = () => {
	const res = {
		statusCode: null,
		body: null,
		status(code) {
			this.statusCode = code;
			return this;
		},
		json(payload) {
			this.body = payload;
			return this;
		},
	};
	return res;
};

const run = (err) => {
	const res = mockRes();
	errorHandler(err, {}, res, () => {});
	return res;
};

test("P2025 (record not found) -> 404", () => {
	const res = run({ name: "PrismaClientKnownRequestError", code: "P2025" });
	assert.equal(res.statusCode, 404);
	assert.deepEqual(res.body, { success: false, message: "Record not found" });
});

test("P2002 (unique violation) -> 409 with field name", () => {
	const res = run({
		name: "PrismaClientKnownRequestError",
		code: "P2002",
		meta: { target: ["email"] },
	});
	assert.equal(res.statusCode, 409);
	assert.equal(res.body.message, "email already exists");
});

test("P2003 (foreign-key violation) -> 400, not 500", () => {
	const res = run({
		name: "PrismaClientKnownRequestError",
		code: "P2003",
		meta: { target: ["patientId"] },
	});
	assert.equal(res.statusCode, 400);
	assert.match(res.body.message, /patientId/);
	assert.equal(res.body.success, false);
});

test("PrismaClientValidationError (bad cuid / bad enum in query) -> 400, not 500", () => {
	const res = run({ name: "PrismaClientValidationError", message: "Argument id: abc is invalid" });
	assert.equal(res.statusCode, 400);
	assert.equal(res.body.success, false);
	// In production the raw Prisma message must not leak.
	process.env.NODE_ENV = "production";
	const resProd = run({ name: "PrismaClientValidationError", message: "Argument id: abc is invalid" });
	assert.equal(resProd.body.message, "Invalid request parameters");
	delete process.env.NODE_ENV;
});

test("unknown Prisma request error -> 400 with generic prod message", () => {
	process.env.NODE_ENV = "production";
	const res = run({ name: "PrismaClientKnownRequestError", code: "P1001", message: "db down detail" });
	assert.equal(res.statusCode, 400);
	assert.equal(res.body.message, "Database request failed");
	delete process.env.NODE_ENV;
});

test("JWT errors keep their 401 messages", () => {
	assert.equal(run({ name: "JsonWebTokenError" }).statusCode, 401);
	assert.equal(run({ name: "JsonWebTokenError" }).body.message, "Invalid token");
	assert.equal(run({ name: "TokenExpiredError" }).body.message, "Token expired");
});

test("business errors with statusCode pass through (400/404 from services)", () => {
	const err = new Error("Paid amount exceeds the total amount");
	err.statusCode = 400;
	const res = run(err);
	assert.equal(res.statusCode, 400);
	assert.equal(res.body.message, "Paid amount exceeds the total amount");
});

test("unexpected errors -> 500, message masked in production", () => {
	process.env.NODE_ENV = "production";
	const res = run(new Error("sensitive internals"));
	assert.equal(res.statusCode, 500);
	assert.equal(res.body.message, "Internal server error");
	delete process.env.NODE_ENV;
	const resDev = run(new Error("dev detail"));
	assert.equal(resDev.body.message, "dev detail");
});
