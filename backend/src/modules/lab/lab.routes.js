const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isLabStaff } = require("../../middleware/rbac");
const prisma = require("../../config/db");
const {
	sendSuccess,
	sendCreated,
	sendError,
} = require("../../utils/apiResponse");
const { paginate, paginateMeta } = require("../../utils/pagination");
const validate = require("../../middleware/validate");
const {
	orderLabResultSchema,
	updateLabResultSchema,
} = require("./lab.validation");

// Lab access must match the frontend roles: ADMIN, DOCTOR, LAB_TECH
router.use(authenticate, isLabStaff);

// GET /api/lab/tests
router.get("/tests", async (req, res, next) => {
	try {
		const tests = await prisma.labTest.findMany({
			where: { isActive: true },
			orderBy: { testName: "asc" },
		});
		return sendSuccess(res, tests);
	} catch (err) {
		next(err);
	}
});

// GET /api/lab/results
router.get("/results", async (req, res, next) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const { status, patientId, search } = req.query;

		const where = {
			...(status && { status }),
			...(patientId && { patientId }),
			...(search && {
				patient: { fullName: { contains: search, mode: "insensitive" } },
			}),
		};

		const [data, total] = await Promise.all([
			prisma.labResult.findMany({
				where,
				skip,
				take: limit,
				orderBy: { orderedAt: "desc" },
				include: {
					patient: { select: { id: true, fullName: true, patientCode: true } },
					test: true,
				},
			}),
			prisma.labResult.count({ where }),
		]);

		return sendSuccess(
			res,
			data,
			"Lab results",
			200,
			paginateMeta(total, page, limit),
		);
	} catch (err) {
		next(err);
	}
});

// POST /api/lab/results — order a test
router.post("/results", validate(orderLabResultSchema, "body", 400), async (req, res, next) => {
	try {
		const { patientId, testId, encounterId } = req.body;
		const result = await prisma.labResult.create({
			data: { patientId, testId, encounterId, status: "PENDING" },
			include: { patient: { select: { fullName: true } }, test: true },
		});
		return sendCreated(res, result, "Lab test ordered");
	} catch (err) {
		next(err);
	}
});

// PUT /api/lab/results/:id — enter result
router.put("/results/:id", validate(updateLabResultSchema, "body", 400), async (req, res, next) => {
	try {
		if (Object.keys(req.body).length === 0) {
			return sendError(res, "No fields to update", 400);
		}
		const { resultData, interpretation, notes, status } = req.body;
		const result = await prisma.labResult.update({
			where: { id: req.params.id },
			data: {
				resultData,
				interpretation,
				notes,
				status: status || "COMPLETED",
				resultAt: new Date(),
			},
		});
		return sendSuccess(res, result, "Result saved");
	} catch (err) {
		next(err);
	}
});

module.exports = router;
