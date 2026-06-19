const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const prisma = require("../../config/db");
const { sendSuccess } = require("../../utils/apiResponse");

router.use(authenticate);

router.get("/stats", async (req, res, next) => {
	try {
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date();
		todayEnd.setHours(23, 59, 59, 999);

		const [totalPatients, todayAppointments, pendingLabs, revenueResult] =
			await Promise.all([
				prisma.patient.count({ where: { deletedAt: null } }),
				prisma.appointment.count({
					where: {
						appointmentDateAD: { gte: todayStart, lte: todayEnd },
						status: { not: "CANCELLED" },
					},
				}),
				prisma.labResult.count({
					where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
				}),
				prisma.payment.aggregate({
					_sum: { amount: true },
					where: { paidAt: { gte: todayStart, lte: todayEnd } },
				}),
			]);

		return sendSuccess(res, {
			totalPatients,
			todayAppointments,
			pendingLabs,
			todayRevenue: revenueResult._sum.amount
				? parseFloat(revenueResult._sum.amount.toString())
				: 0,
		});
	} catch (err) {
		next(err);
	}
});

module.exports = router;
