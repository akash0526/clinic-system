const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isStaff } = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const svc = require("./appointment.service");
const { sendSuccess, sendCreated } = require("../../utils/apiResponse");
const {
	createAppointmentSchema,
	updateStatusSchema,
} = require("./appointment.validation");

router.use(authenticate);

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

router.post("/", isStaff, validate(createAppointmentSchema), async (req, res, next) => {
	try {
		const appt = await svc.createAppointment(req.body, req.user.id);
		return sendCreated(res, appt, "Appointment booked");
	} catch (err) {
		next(err);
	}
});

router.patch(
	"/:id/status",
	isStaff,
	validate(updateStatusSchema, "body", 400),
	async (req, res, next) => {
		try {
			const appt = await svc.updateAppointmentStatus(
				req.params.id,
				req.body.status,
			);
			return sendSuccess(res, appt, "Status updated");
		} catch (err) {
			next(err);
		}
	},
);

module.exports = router;
