const router = require("express").Router();
const bcrypt = require("bcryptjs");
const authenticate = require("../../middleware/auth");
const { isAdmin } = require("../../middleware/rbac");
const prisma = require("../../config/db");
const { sendSuccess, sendCreated } = require("../../utils/apiResponse");
const validate = require("../../middleware/validate");
const { z } = require("zod");

router.use(authenticate, isAdmin);

const userSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8).optional(),
	fullName: z.string().min(2),
	fullNameNe: z.string().optional(),
	role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "LAB_TECH"]),
	phone: z.string().optional(),
	licenseNumber: z.string().optional(),
	specialization: z.string().optional(),
	isActive: z.boolean().optional(),
});

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

router.put("/:id", async (req, res, next) => {
	try {
		const { password, ...data } = req.body;
		const updateData = { ...data };
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
