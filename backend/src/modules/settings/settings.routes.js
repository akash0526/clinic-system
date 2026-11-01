const router = require("express").Router();
const { z } = require("zod");
const authenticate = require("../../middleware/auth");
const { isAdmin, isStaff } = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const prisma = require("../../config/db");
const { sendSuccess } = require("../../utils/apiResponse");

// Settings are arbitrary key/value pairs, but values must be scalars —
// objects/arrays would be String()ed into "[object Object]" below.
const settingsUpdateSchema = z
	.record(
		z.string().min(1, "Setting key must not be empty"),
		z.union([z.string(), z.number(), z.boolean()]),
	)
	.refine((obj) => Object.keys(obj).length > 0, {
		message: "No settings provided",
	});

router.use(authenticate);

router.get("/", isStaff, async (req, res, next) => {
	try {
		const settings = await prisma.clinicSettings.findMany({
			orderBy: { key: "asc" },
		});
		return sendSuccess(res, settings);
	} catch (err) {
		next(err);
	}
});

router.put("/", isAdmin, validate(settingsUpdateSchema), async (req, res, next) => {
	try {
		const updates = Object.entries(req.body).map(([key, value]) =>
			prisma.clinicSettings.upsert({
				where: { key },
				update: { value: String(value) },
				create: { key, value: String(value) },
			}),
		);
		await prisma.$transaction(updates);
		return sendSuccess(res, null, "Settings updated");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
