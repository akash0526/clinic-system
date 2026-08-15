// Unit tests for the lab + encounter validation schemas (critical-fixes batch).
// No database required — safe to run in CI under `node --test`.
const test = require("node:test");
const assert = require("node:assert/strict");

const {
	orderLabResultSchema,
	updateLabResultSchema,
} = require("../src/modules/lab/lab.validation");
const {
	encounterSchema,
	updateEncounterSchema,
} = require("../src/modules/encounters/encounter.validation");

const CUID = "c1234567890123456789012";

test("orderLabResultSchema requires patientId and testId", () => {
	assert.equal(orderLabResultSchema.safeParse({}).success, false);
	assert.equal(orderLabResultSchema.safeParse({ patientId: CUID }).success, false);
	assert.equal(orderLabResultSchema.safeParse({ testId: CUID }).success, false);
	assert.equal(
		orderLabResultSchema.safeParse({ patientId: CUID, testId: CUID }).success,
		true,
	);
	assert.equal(
		orderLabResultSchema.safeParse({ patientId: "not-a-cuid", testId: CUID }).success,
		false,
	);
	assert.equal(
		orderLabResultSchema.safeParse({ patientId: CUID, testId: CUID, encounterId: CUID }).success,
		true,
	);
});

test("updateLabResultSchema rejects invalid status, allows free-form resultData", () => {
	assert.equal(updateLabResultSchema.safeParse({ status: "BOGUS" }).success, false);
	for (const status of ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]) {
		assert.equal(updateLabResultSchema.safeParse({ status }).success, true);
	}
	assert.equal(updateLabResultSchema.safeParse({ notes: "done" }).success, true);
	assert.equal(
		updateLabResultSchema.safeParse({ resultData: { value: "120", unit: "mg/dL", normalRange: "70-100" } }).success,
		true,
	);
});

test("encounterSchema validates required patientId and numeric types", () => {
	assert.equal(encounterSchema.safeParse({}).success, false); // patientId required
	assert.equal(
		encounterSchema.safeParse({ patientId: CUID, weightKg: 65 }).success,
		true,
	);
	assert.equal(
		encounterSchema.safeParse({ patientId: CUID, weightKg: "sixty-five" }).success,
		false,
	);
	assert.equal(
		encounterSchema.safeParse({ patientId: CUID, pulseRate: 72.5 }).success,
		false, // int required
	);
	assert.equal(
		encounterSchema.safeParse({
			patientId: CUID,
			diagnoses: [{ code: "J00", description: "Common cold" }],
		}).success,
		true,
	);
});

test("updateEncounterSchema allows partial updates but still type-checks", () => {
	assert.equal(updateEncounterSchema.safeParse({ subjective: "fever" }).success, true);
	assert.equal(updateEncounterSchema.safeParse({ weightKg: 61 }).success, true);
	assert.equal(updateEncounterSchema.safeParse({ weightKg: "abc" }).success, false);
	assert.equal(updateEncounterSchema.safeParse({ followUpDateAD: "2026-09-01" }).success, true);
	assert.equal(updateEncounterSchema.safeParse({ followUpDateAD: "not-a-date" }).success, false);
});
