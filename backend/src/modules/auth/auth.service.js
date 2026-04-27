// Auth business logic separated from controller

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/db");

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password
 */
const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Compare plain-text with hashed password
 */
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

/**
 * Generate JWT access token
 */
const generateToken = (userId, role) => {
	return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN || "7d",
	});
};

/**
 * Register a new user (admin only can create users)
 */
const registerUser = async ({
	email,
	password,
	fullName,
	fullNameNe,
	role,
	phone,
	licenseNumber,
	specialization,
}) => {
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		const err = new Error("Email already registered");
		err.statusCode = 409;
		throw err;
	}

	const passwordHash = await hashPassword(password);

	const user = await prisma.user.create({
		data: {
			email,
			passwordHash,
			fullName,
			fullNameNe,
			role,
			phone,
			licenseNumber,
			specialization,
		},
		select: {
			id: true,
			email: true,
			fullName: true,
			role: true,
			isActive: true,
			createdAt: true,
		},
	});

	return user;
};

/**
 * Login user — returns user + token
 */
const loginUser = async ({ email, password }) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user || !user.isActive) {
		const err = new Error("Invalid credentials");
		err.statusCode = 401;
		throw err;
	}

	const isValid = await comparePassword(password, user.passwordHash);
	if (!isValid) {
		const err = new Error("Invalid credentials");
		err.statusCode = 401;
		throw err;
	}

	const token = generateToken(user.id, user.role);

	// Return user without sensitive fields
	const { passwordHash, ...safeUser } = user;
	return { user: safeUser, token };
};

module.exports = { registerUser, loginUser, hashPassword, generateToken };
