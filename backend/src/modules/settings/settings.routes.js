const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isAdmin, isStaff } = require("../../middleware/rbac");
const prisma = require("../../config/db");
const { sendSuccess } = require("../../utils/apiResponse");

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

router.put("/", isAdmin, async (req, res, next) => {
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
