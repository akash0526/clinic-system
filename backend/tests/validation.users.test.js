// Unit tests for the users-module validation schemas (critical-fixes batch).
// No database required — safe to run in CI under `node --test`.
const test = require("node:test");
const assert = require("node:assert/strict");

const { userSchema, updateUserSchema } = require("../src/modules/users/user.validation");

test("updateUserSchema rejects direct credential fields (passwordHash)", () => {
	const r = updateUserSchema.safeParse({ passwordHash: "$2a$12$fakefakefakefakefake" });
	assert.equal(r.success, false);
	// Strict-mode unknown-key issues report the key in the message / issue.keys.
	const messages = r.error.errors.map((e) => e.message).join(" | ");
	assert.ok(
		messages.includes("passwordHash"),
		`expected passwordHash in error message, got: ${messages}`,
	);
	assert.deepEqual(r.error.errors[0].keys, ["passwordHash"]);
});

test("updateUserSchema rejects other unknown/non-allowlisted fields", () => {
	for (const payload of [
		{ createdAt: "2020-01-01T00:00:00.000Z" },
		{ id: "cmstz4qyf001ryqfe985fxao0" },
		{ passwordHash: "x", fullName: "Jane Doe" }, // even alongside valid fields
	]) {
		const r = updateUserSchema.safeParse(payload);
		assert.equal(r.success, false, `expected rejection for ${JSON.stringify(payload)}`);
	}
});

test("updateUserSchema accepts only allow-listed fields", () => {
	for (const payload of [
		{ fullName: "Jane Doe" },
		{ email: "jane@clinic.com" },
		{ role: "DOCTOR" },
		{ phone: "9800000000" },
		{ licenseNumber: "NMC-12345" },
		{ specialization: "Cardiology" },
		{ isActive: false },
		{ password: "Secret@123" }, // plain-text password IS allowed (secure flow)
		{ fullName: "Jane", email: "jane@clinic.com", role: "LAB_TECH" },
	]) {
		const r = updateUserSchema.safeParse(payload);
		assert.equal(r.success, true, `expected acceptance for ${JSON.stringify(payload)}: ${JSON.stringify(r.error?.errors)}`);
	}
});

test("updateUserSchema enforces password strength and role enum", () => {
	assert.equal(updateUserSchema.safeParse({ password: "short" }).success, false);
	assert.equal(updateUserSchema.safeParse({ role: "SUPERUSER" }).success, false);
	assert.equal(updateUserSchema.safeParse({ email: "not-an-email" }).success, false);
});

test("userSchema (POST) still requires fullName and role; base password optional", () => {
	assert.equal(userSchema.safeParse({ email: "a@b.com", fullName: "A B", role: "ADMIN" }).success, true);
	assert.equal(userSchema.safeParse({ email: "a@b.com", role: "ADMIN" }).success, false); // fullName missing
	assert.equal(userSchema.safeParse({ email: "a@b.com", fullName: "A B" }).success, false); // role missing
});
