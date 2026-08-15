// Unit tests for the appointments-module validation schemas (critical-fixes batch).
// No database required — safe to run in CI under `node --test`.
const test = require("node:test");
const assert = require("node:assert/strict");

const {
	createAppointmentSchema,
	updateStatusSchema,
} = require("../src/modules/appointments/appointment.validation");

const CUID = "c1234567890123456789012";

test("updateStatusSchema accepts only AppointmentStatus enum values", () => {
	for (const status of ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]) {
		assert.equal(
			updateStatusSchema.safeParse({ status }).success,
			true,
			`expected ${status} to be valid`,
		);
	}
	for (const status of ["BOGUS", "DONE", "PENDING", "", "confirmed", 123]) {
		assert.equal(
			updateStatusSchema.safeParse({ status }).success,
			false,
			`expected ${JSON.stringify(status)} to be invalid`,
		);
	}
});

test("updateStatusSchema requires status (no empty body)", () => {
	assert.equal(updateStatusSchema.safeParse({}).success, false);
});

test("createAppointmentSchema validates date format and required fields", () => {
	assert.equal(
		createAppointmentSchema.safeParse({
			patientId: CUID,
			doctorId: CUID,
			appointmentDateAD: "2026-09-01",
			appointmentTime: "10:30 AM",
		}).success,
		true,
	);
	assert.equal(
		createAppointmentSchema.safeParse({
			patientId: CUID,
			doctorId: CUID,
			appointmentDateAD: "01-09-2026", // wrong format
			appointmentTime: "10:30 AM",
		}).success,
		false,
	);
	assert.equal(
		createAppointmentSchema.safeParse({ doctorId: CUID, appointmentDateAD: "2026-09-01", appointmentTime: "10:30 AM" }).success,
		false, // patientId missing
	);
});
