const router = require("express").Router();
const bcrypt = require("bcryptjs");
const authenticate = require("../../middleware/auth");
const { isAdmin } = require("../../middleware/rbac");
const prisma = require("../../config/db");
const { sendSuccess, sendCreated, sendError } = require("../../utils/apiResponse");
const validate = require("../../middleware/validate");
const { z } = require("zod");
const { userSchema, updateUserSchema } = require("./user.validation");

router.use(authenticate, isAdmin);

router.get("/", async (req, res, next) => {
	try {
		const users = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				fullName: true,
				fullNameNe: true,
				role: true,
				isActive: true,
				phone: true,
				licenseNumber: true,
				specialization: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
		});
		return sendSuccess(res, users);
	} catch (err) {
		next(err);
	}
});

router.post(
	"/",
	validate(userSchema.extend({ password: z.string().min(8) })),
	async (req, res, next) => {
		try {
			const { password, ...data } = req.body;
			const passwordHash = await bcrypt.hash(password, 12);
			const user = await prisma.user.create({
				data: { ...data, passwordHash },
				select: {
					id: true,
					email: true,
					fullName: true,
					role: true,
					isActive: true,
				},
			});
			return sendCreated(res, user, "User created");
		} catch (err) {
			next(err);
		}
	},
);

router.put("/:id", validate(updateUserSchema, "body", 400), async (req, res, next) => {
	try {
		const { password, ...data } = req.body;
		if (!password && Object.keys(data).length === 0) {
			return sendError(res, "No fields to update", 400);
		}
		const updateData = { ...data };
		// Secure flow: only a plain-text `password` is accepted; it is hashed
		// server-side with bcrypt. Raw `passwordHash` never reaches this code
		// (it is rejected by updateUserSchema's strict allowlist).
		if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
		const user = await prisma.user.update({
			where: { id: req.params.id },
			data: updateData,
			select: {
				id: true,
				email: true,
				fullName: true,
				role: true,
				isActive: true,
			},
		});
		return sendSuccess(res, user, "User updated");
	} catch (err) {
		next(err);
	}
});

router.patch("/:id/toggle-active", async (req, res, next) => {
	try {
		const user = await prisma.user.findUniqueOrThrow({
			where: { id: req.params.id },
		});
		const updated = await prisma.user.update({
			where: { id: req.params.id },
			data: { isActive: !user.isActive },
			select: { id: true, isActive: true },
		});
		return sendSuccess(
			res,
			updated,
			`User ${updated.isActive ? "activated" : "deactivated"}`,
		);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
