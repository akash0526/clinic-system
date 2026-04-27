const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isAdmin } = require("../../middleware/rbac");
const { register, login, me, logout } = require("./auth.controller");

// Public routes
router.post("/login", login);

// Protected: only admin can create users
router.post("/register", authenticate, isAdmin, register);

// Authenticated routes
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

module.exports = router;
