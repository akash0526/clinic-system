const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isDoctor, isStaff } = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const svc = require("./encounter.service");
const {
	sendSuccess,
	sendCreated,
	sendError,
} = require("../../utils/apiResponse");
const {
	encounterSchema,
	updateEncounterSchema,
} = require("./encounter.validation");

router.use(authenticate);

router.get("/", isStaff, async (req, res, next) => {
	try {
		const r = await svc.getEncounters(req.query);
		return sendSuccess(res, r.data, "Encounters fetched", 200, r.meta);
	} catch (err) {
		next(err);
	}
});

router.get("/:id", isStaff, async (req, res, next) => {
	try {
		const enc = await svc.getEncounterById(req.params.id);
		return sendSuccess(res, enc);
	} catch (err) {
		next(err);
	}
});

router.post("/", isDoctor, validate(encounterSchema), async (req, res, next) => {
	try {
		const enc = await svc.createEncounter(req.body, req.user.id);
		return sendCreated(res, enc, "Encounter created");
	} catch (err) {
		next(err);
	}
});

router.put("/:id", isDoctor, validate(updateEncounterSchema, "body", 400), async (req, res, next) => {
	try {
		if (Object.keys(req.body).length === 0) {
			return sendError(res, "No fields to update", 400);
		}
		const enc = await svc.updateEncounter(req.params.id, req.body);
		return sendSuccess(res, enc, "Encounter updated");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
