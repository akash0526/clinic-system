// Unit tests for the AD-date guards and the P2002 retry helper.
// No database required.
const test = require("node:test");
const assert = require("node:assert/strict");

const {
	isValidDateOnly,
	parseDateOnly,
	DATE_ONLY_REGEX,
} = require("../src/utils/date");
const { withConflictRetry, isUniqueConflict } = require("../src/utils/retry");
const {
	createAppointmentSchema,
} = require("../src/modules/appointments/appointment.validation");
const {
	createPatientSchema,
} = require("../src/modules/patients/patient.validation");
const {
	createBillSchema,
} = require("../src/modules/billing/bill.validation");

// ── isValidDateOnly ─────────────────────────────────────────

test("isValidDateOnly accepts real calendar dates incl. leap day", () => {
	assert.equal(isValidDateOnly("2026-05-10"), true);
	assert.equal(isValidDateOnly("2024-02-29"), true); // 2024 is a leap year
});

test("isValidDateOnly rejects impossible dates that match the regex shape", () => {
	// V8 rolls these over instead of returning Invalid Date — must be caught.
	assert.equal(isValidDateOnly("2026-02-30"), false);
	assert.equal(isValidDateOnly("2026-04-31"), false);
	assert.equal(isValidDateOnly("2026-13-01"), false);
	assert.equal(isValidDateOnly("2026-02-29"), false); // 2026 not a leap year
});

test("isValidDateOnly rejects non-date strings", () => {
	assert.equal(isValidDateOnly("2026/05/10"), false);
	assert.equal(isValidDateOnly("10-05-2026"), false);
	assert.equal(isValidDateOnly(""), false);
	assert.equal(isValidDateOnly(null), false);
	assert.equal(DATE_ONLY_REGEX.test("2026-02-30"), true); // regex alone is not enough
});

test("parseDateOnly returns null for impossible dates, Date for real ones", () => {
	assert.equal(parseDateOnly("2026-02-30"), null);
	assert.equal(parseDateOnly("2026-13-01"), null);
	assert.ok(parseDateOnly("2026-05-10") instanceof Date);
	assert.equal(parseDateOnly(""), null);
	assert.equal(parseDateOnly(null), null);
});

// ── schema-level enforcement ────────────────────────────────

const CUID = "cmstz4qyf001ryqfe985fxao0";

test("appointment schema rejects impossible calendar date with 422-style error", () => {
	const r = createAppointmentSchema.safeParse({
		patientId: CUID,
		doctorId: CUID,
		appointmentDateAD: "2026-02-30",
		appointmentTime: "10:00 AM",
	});
	assert.equal(r.success, false);
	const dateIssue = r.error.errors.find((e) => e.path[0] === "appointmentDateAD");
	assert.ok(dateIssue, "expected an issue on appointmentDateAD");
	assert.match(dateIssue.message, /Invalid calendar date/);
});

test("patient schema rejects impossible dobAD but accepts empty string and valid date", () => {
	const base = { fullName: "Test Patient", gender: "MALE" };
	assert.equal(createPatientSchema.safeParse({ ...base, dobAD: "2026-02-30" }).success, false);
	assert.equal(createPatientSchema.safeParse({ ...base, dobAD: "" }).success, true);
	assert.equal(createPatientSchema.safeParse({ ...base, dobAD: "1990-05-10" }).success, true);
});

test("bill schema requires cuid patientId (422 instead of later FK 500)", () => {
	const bad = createBillSchema.safeParse({
		patientId: "not-a-cuid",
		items: [{ description: "Consult", quantity: 1, unitPrice: 100 }],
	});
	assert.equal(bad.success, false);
	const good = createBillSchema.safeParse({
		patientId: CUID,
		items: [{ description: "Consult", quantity: 1, unitPrice: 100 }],
	});
	assert.equal(good.success, true);
});

// ── withConflictRetry ───────────────────────────────────────

test("isUniqueConflict matches only P2002 known-request errors", () => {
	assert.equal(isUniqueConflict({ name: "PrismaClientKnownRequestError", code: "P2002" }), true);
	assert.equal(isUniqueConflict({ name: "PrismaClientKnownRequestError", code: "P2025" }), false);
	assert.equal(isUniqueConflict(new Error("boom")), false);
	assert.equal(isUniqueConflict(null), false);
});

test("withConflictRetry returns the result on first success", async () => {
	let calls = 0;
	const out = await withConflictRetry(async () => {
		calls++;
		return "ok";
	});
	assert.equal(out, "ok");
	assert.equal(calls, 1);
});

test("withConflictRetry retries on P2002 and eventually succeeds", async () => {
	let calls = 0;
	const out = await withConflictRetry(async () => {
		calls++;
		if (calls < 3) {
			throw { name: "PrismaClientKnownRequestError", code: "P2002", meta: { target: ["patientCode"] } };
		}
		return "created";
	});
	assert.equal(out, "created");
	assert.equal(calls, 3);
});

test("withConflictRetry rethrows non-conflict errors immediately", async () => {
	let calls = 0;
	await assert.rejects(
		withConflictRetry(async () => {
			calls++;
			throw new Error("fatal");
		}),
		/fatal/,
	);
	assert.equal(calls, 1);
});

test("withConflictRetry gives up after the attempt limit and rethrows the P2002", async () => {
	let calls = 0;
	await assert.rejects(
		withConflictRetry(async () => {
			calls++;
			throw { name: "PrismaClientKnownRequestError", code: "P2002" };
		}, 3),
		(err) => err.code === "P2002",
	);
	assert.equal(calls, 3);
});
