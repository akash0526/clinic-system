const router = require("express").Router();
const { z } = require("zod");
const authenticate = require("../../middleware/auth");
const { isStaff } = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const svc = require("./appointment.service");
const { sendSuccess, sendCreated } = require("../../utils/apiResponse");

router.use(authenticate);

const createSchema = z.object({
	patientId: z.string().cuid(),
	doctorId: z.string().cuid(),
	appointmentDateBS: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	appointmentTime: z.string(),
	type: z.string().default("OPD"),
	chiefComplaint: z.string().optional(),
	notes: z.string().optional(),
	duration: z.number().int().default(15),
});

router.get("/", isStaff, async (req, res, next) => {
	try {
		const r = await svc.getAppointments(req.query);
		return sendSuccess(res, r.data, "Appointments fetched", 200, r.meta);
	} catch (err) {
		next(err);
	}
});

router.get("/doctors", isStaff, async (req, res, next) => {
	try {
		const doctors = await svc.getDoctors();
		return sendSuccess(res, doctors);
	} catch (err) {
		next(err);
	}
});

router.get("/:id", isStaff, async (req, res, next) => {
	try {
		const appt = await svc.getAppointmentById(req.params.id);
		return sendSuccess(res, appt);
	} catch (err) {
		next(err);
	}
});

router.post("/", isStaff, validate(createSchema), async (req, res, next) => {
	try {
		const appt = await svc.createAppointment(req.body, req.user.id);
		return sendCreated(res, appt, "Appointment booked");
	} catch (err) {
		next(err);
	}
});

router.patch("/:id/status", isStaff, async (req, res, next) => {
	try {
		const { status } = req.body;
		const appt = await svc.updateAppointmentStatus(req.params.id, status);
		return sendSuccess(res, appt, "Status updated");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
