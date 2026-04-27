const router = require("express").Router();
const { z } = require("zod");
const authenticate = require("../../middleware/auth");
const { isDoctor, isStaff } = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const svc = require("./encounter.service");
const { sendSuccess, sendCreated } = require("../../utils/apiResponse");

router.use(authenticate);

const schema = z.object({
	patientId: z.string().cuid(),
	appointmentId: z.string().cuid().optional(),
	weightKg: z.number().optional(),
	heightCm: z.number().optional(),
	temperature: z.number().optional(),
	pulseRate: z.number().int().optional(),
	respiratoryRate: z.number().int().optional(),
	bloodPressureSystolic: z.number().int().optional(),
	bloodPressureDiastolic: z.number().int().optional(),
	oxygenSaturation: z.number().optional(),
	bloodSugar: z.number().optional(),
	subjective: z.string().optional(),
	objective: z.string().optional(),
	assessment: z.string().optional(),
	plan: z.string().optional(),
	diagnoses: z
		.array(z.object({ code: z.string(), description: z.string() }))
		.optional(),
	followUpDateBS: z.string().optional(),
	followUpNotes: z.string().optional(),
});

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

router.post("/", isDoctor, validate(schema), async (req, res, next) => {
	try {
		const enc = await svc.createEncounter(req.body, req.user.id);
		return sendCreated(res, enc, "Encounter created");
	} catch (err) {
		next(err);
	}
});

router.put("/:id", isDoctor, async (req, res, next) => {
	try {
		const enc = await svc.updateEncounter(req.params.id, req.body);
		return sendSuccess(res, enc, "Encounter updated");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
