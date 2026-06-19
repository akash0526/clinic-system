const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isDoctor, isStaff } = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const controller = require("./prescription.controller");
const {
	createPrescriptionSchema,
	updatePrescriptionSchema,
	dispensePrescriptionSchema,
} = require("./prescription.validation");

router.use(authenticate);

router.get("/", isStaff, controller.list);
router.get("/:id", isStaff, controller.show);
router.post("/", isDoctor, validate(createPrescriptionSchema), controller.create);
router.put("/:id", isDoctor, validate(updatePrescriptionSchema), controller.update);
router.post(
	"/:id/dispense",
	isStaff,
	validate(dispensePrescriptionSchema),
	controller.dispense,
);

module.exports = router;
