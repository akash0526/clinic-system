// Integration regression tests for the critical-fixes batch.
//
// Requires a reachable PostgreSQL database and a JWT secret:
//   DATABASE_URL=... JWT_SECRET=... node --test tests/integration.test.js
//
// In CI (where no DATABASE_URL is set) the suite is skipped, so the plain
// `node --test` used by the CI workflow stays green without a database.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const RUN = Boolean(process.env.DATABASE_URL && process.env.JWT_SECRET);

const SKIP_REASON = "Set DATABASE_URL and JWT_SECRET to run integration tests";

let server;
let base;
let adminToken;

// ─── tiny HTTP helper (uses the Bearer token returned by login) ─────────────
async function call(method, path, token, body) {
	const headers = { "Content-Type": "application/json" };
	if (token) headers.Authorization = `Bearer ${token}`;
	const res = await fetch(`${base}${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await res.text();
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		parsed = { raw: text };
	}
	return { status: res.status, body: parsed };
}
const get = (p, t) => call("GET", p, t);
const post = (p, t, b) => call("POST", p, t, b);
const put = (p, t, b) => call("PUT", p, t, b);
const patch = (p, t, b) => call("PATCH", p, t, b);

if (!RUN) {
	test("integration suite skipped", { skip: SKIP_REASON }, () => {});
} else {
	before(async () => {
		// Import the express app only when we actually have a DB to hit.
		// (config/env.js exits the process if DATABASE_URL/JWT_SECRET are missing.)
		const app = require("../src/app");
		server = await new Promise((resolve) => {
			const s = app.listen(0, () => resolve(s));
		});
		base = `http://127.0.0.1:${server.address().port}/api`;

		const email = process.env.TEST_ADMIN_EMAIL || "admin@clinic.com";
		const password = process.env.TEST_ADMIN_PASSWORD || "Admin@12345";
		const res = await fetch(`${base}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		const text = await res.text();
		assert.equal(
			res.status,
			200,
			`admin login failed (${res.status}): ${text}`,
		);
		adminToken = JSON.parse(text).data.token;
	});

	after(async () => {
		if (server) await new Promise((r) => server.close(r));
	});

	test(
		"prescription numbers: 8 parallel creates yield 8 unique numbers, zero 409s",
		{ timeout: 30000 },
		async () => {
			const stamp = Date.now();
			const patient = await post(
				"/patients",
				adminToken,
				{ fullName: `Race Patient ${stamp}`, gender: "MALE" },
			);
			assert.equal(patient.status, 201, JSON.stringify(patient.body));

			const enc = await post(
				"/encounters",
				adminToken,
				{ patientId: patient.body.data.id },
			);
			assert.equal(enc.status, 201, JSON.stringify(enc.body));

			const results = await Promise.all(
				Array.from({ length: 8 }, () =>
					post("/prescriptions", adminToken, {
						patientId: patient.body.data.id,
						encounterId: enc.body.data.id,
						notes: "race test",
						items: [{ drugName: "Race Med", quantityPrescribed: 5 }],
					}),
				),
			);

			const statuses = results.map((r) => r.status);
			const ok = results.filter((r) => r.status === 201);
			const nums = ok.map((r) => r.body.data.prescriptionNumber);

			assert.equal(
				results.filter((r) => r.status === 409).length,
				0,
				`expected zero 409s, got statuses: ${statuses.join(",")}`,
			);
			assert.equal(ok.length, 8, `expected 8 successes, got: ${statuses.join(",")}`);
			assert.equal(
				new Set(nums).size,
				8,
				`expected 8 unique prescription numbers, got: ${nums.join(",")}`,
			);
		},
	);

	test(
		"PUT /users/:id rejects raw passwordHash and keeps the secure password flow",
		{ timeout: 30000 },
		async () => {
			const email = `user-${Date.now()}@test.com`;
			const originalPassword = "Original@123";
			const created = await post("/users", adminToken, {
				email,
				password: originalPassword,
				fullName: "Throwaway",
				role: "RECEPTIONIST",
			});
			assert.equal(created.status, 201, JSON.stringify(created.body));
			const userId = created.body.data.id;

			// Attack: try to assign a password hash directly.
			const attack = await put(
				`/users/${userId}`,
				adminToken,
				{ passwordHash: "$2a$12$fakefakefakefakefakefakefakefake" },
			);
			assert.ok(
				attack.status >= 400 && attack.status < 500,
				`expected 4xx for passwordHash, got ${attack.status}: ${JSON.stringify(attack.body)}`,
			);
			const attackText = JSON.stringify(attack.body).toLowerCase();
			assert.equal(attackText.includes("prisma"), false, "must not leak Prisma internals");

			// The original password must still work (hash was NOT overwritten).
			const originalLogin = await fetch(`${base}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password: originalPassword }),
			});
			assert.equal(originalLogin.status, 200, "original password must still work");

			// The secure flow (plain-text password, hashed server-side) must still work.
			const newPassword = "NewPass@456";
			const upd = await put(`/users/${userId}`, adminToken, { password: newPassword });
			assert.equal(upd.status, 200, JSON.stringify(upd.body));
			const newLogin = await fetch(`${base}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password: newPassword }),
			});
			assert.equal(newLogin.status, 200, "new password should work after secure update");

			// Unknown fields are rejected by the strict allowlist.
			const unknown = await put(`/users/${userId}`, adminToken, { createdAt: "2020-01-01" });
			assert.ok(
				unknown.status >= 400 && unknown.status < 500,
				`expected 4xx for unknown field, got ${unknown.status}`,
			);
		},
	);

	test(
		"PATCH /appointments/:id/status: invalid enum -> 400, no Prisma leak; valid -> 200",
		{ timeout: 30000 },
		async () => {
			const stamp = Date.now();
			const patient = await post(
				"/patients",
				adminToken,
				{ fullName: `Appt Patient ${stamp}`, gender: "MALE" },
			);
			assert.equal(patient.status, 201, JSON.stringify(patient.body));

			const doctors = await get("/appointments/doctors", adminToken);
			const doctorId = doctors.body.data[0].id;

			const appt = await post("/appointments", adminToken, {
				patientId: patient.body.data.id,
				doctorId,
				appointmentDateAD: "2026-09-01",
				appointmentTime: "10:00 AM",
			});
			assert.equal(appt.status, 201, JSON.stringify(appt.body));
			const apptId = appt.body.data.id;

			const bad = await patch(`/appointments/${apptId}/status`, adminToken, { status: "BOGUS" });
			assert.equal(
				bad.status,
				400,
				`expected 400 for invalid status, got ${bad.status}: ${JSON.stringify(bad.body)}`,
			);
			const badText = JSON.stringify(bad.body).toLowerCase();
			assert.equal(badText.includes("prisma"), false, "must not leak Prisma internals");
			assert.equal(badText.includes("invocation"), false, "must not leak Prisma invocation");

			const good = await patch(`/appointments/${apptId}/status`, adminToken, { status: "COMPLETED" });
			assert.equal(good.status, 200, JSON.stringify(good.body));
			assert.equal(good.body.data.status, "COMPLETED");
		},
	);

	test(
		"lab + encounter routes: invalid input -> 400, no Prisma leak; valid input still works",
		{ timeout: 30000 },
		async () => {
			const stamp = Date.now();
			const patient = await post(
				"/patients",
				adminToken,
				{ fullName: `Lab Patient ${stamp}`, gender: "FEMALE" },
			);
			assert.equal(patient.status, 201, JSON.stringify(patient.body));
			const patientId = patient.body.data.id;

			// --- lab: ordering a test with missing required fields ---
			const missing = await post("/lab/results", adminToken, {});
			assert.equal(
				missing.status,
				400,
				`expected 400 for missing lab fields, got ${missing.status}: ${JSON.stringify(missing.body)}`,
			);
			const missingText = JSON.stringify(missing.body).toLowerCase();
			assert.equal(missingText.includes("prisma"), false, "must not leak Prisma internals");

			// --- lab: entering a result with an invalid status ---
			const tests = await get("/lab/tests", adminToken);
			assert.ok(tests.body.data.length > 0, "expected seeded lab tests");
			const ordered = await post("/lab/results", adminToken, {
				patientId,
				testId: tests.body.data[0].id,
			});
			assert.equal(ordered.status, 201, JSON.stringify(ordered.body));
			const badStatus = await put(
				`/lab/results/${ordered.body.data.id}`,
				adminToken,
				{ status: "BOGUS" },
			);
			assert.equal(
				badStatus.status,
				400,
				`expected 400 for invalid lab status, got ${badStatus.status}: ${JSON.stringify(badStatus.body)}`,
			);

			// --- lab: valid result entry still works ---
			const goodLab = await put(`/lab/results/${ordered.body.data.id}`, adminToken, {
				resultData: { value: "120", unit: "mg/dL", normalRange: "70-100" },
				status: "COMPLETED",
				notes: "ok",
			});
			assert.equal(goodLab.status, 200, JSON.stringify(goodLab.body));

			// --- encounter: invalid numeric type on update ---
			const enc = await post("/encounters", adminToken, { patientId, weightKg: 60 });
			assert.equal(enc.status, 201, JSON.stringify(enc.body));
			const badEnc = await put(`/encounters/${enc.body.data.id}`, adminToken, { weightKg: "sixty" });
			assert.equal(
				badEnc.status,
				400,
				`expected 400 for invalid encounter field, got ${badEnc.status}: ${JSON.stringify(badEnc.body)}`,
			);
			const badEncText = JSON.stringify(badEnc.body).toLowerCase();
			assert.equal(badEncText.includes("prisma"), false, "must not leak Prisma internals");

			// --- encounter: valid update still works ---
			const goodEnc = await put(`/encounters/${enc.body.data.id}`, adminToken, { weightKg: 61 });
			assert.equal(goodEnc.status, 200, JSON.stringify(goodEnc.body));
			assert.equal(goodEnc.body.data.weightKg, 61);
		},
	);
}
