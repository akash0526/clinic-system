const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isStaff } = require("../../middleware/rbac");
const svc = require("./bill.service");
const { sendSuccess, sendCreated } = require("../../utils/apiResponse");

router.use(authenticate, isStaff);

router.get("/", async (req, res, next) => {
	try {
		const r = await svc.getBills(req.query);
		return sendSuccess(res, r.data, "Bills fetched", 200, r.meta);
	} catch (err) {
		next(err);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const bill = await svc.getBillById(req.params.id);
		return sendSuccess(res, bill);
	} catch (err) {
		next(err);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const bill = await svc.createBill(req.body);
		return sendCreated(res, bill, "Bill created");
	} catch (err) {
		next(err);
	}
});

router.post("/:id/payment", async (req, res, next) => {
	try {
		const { amount, method, reference } = req.body;
		const payment = await svc.addPayment(
			req.params.id,
			amount,
			method,
			reference,
		);
		return sendSuccess(res, payment, "Payment recorded");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
