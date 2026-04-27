const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isAdmin, isStaff } = require("../../middleware/rbac");
const ctrl = require("./patient.controller");

// All patient routes require authentication
router.use(authenticate);

router.get("/", isStaff, ctrl.list); // All staff can view
router.get("/:id", isStaff, ctrl.show);
router.post("/", isStaff, ctrl.create);
router.put("/:id", isStaff, ctrl.update);
router.delete("/:id", isAdmin, ctrl.remove); // Only admin can delete

module.exports = router;
