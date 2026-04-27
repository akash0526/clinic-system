// FIXED: dotenv must be loaded first, before any other require
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const errorHandler = require("./middleware/errorHandler");

// Route modules
const authRoutes = require("./modules/auth/auth.routes");
const patientRoutes = require("./modules/patients/patient.routes");
const appointmentRoutes = require("./modules/appointments/appointment.routes");
const encounterRoutes = require("./modules/encounters/encounter.routes");
const billingRoutes = require("./modules/billing/bill.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");
const labRoutes = require("./modules/lab/lab.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

const app = express();

// ── Security & Parsing ────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP off for dev
app.use(compression());
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		credentials: true,
	}),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Rate Limiting ─────────────────────────────────────────
app.use(
	"/api/auth/login",
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 20,
		message: {
			success: false,
			message: "Too many login attempts. Try again later.",
		},
	}),
);

app.use(
	"/api",
	rateLimit({
		windowMs: 60 * 1000,
		max: 500,
	}),
);

// ── Routes ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/encounters", encounterRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── Health check ──────────────────────────────────────────
app.get("/api/health", (req, res) => {
	res.json({
		success: true,
		message: "Clinic API running ✓",
		timestamp: new Date().toISOString(),
	});
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
	res
		.status(404)
		.json({
			success: false,
			message: `Route not found: ${req.method} ${req.path}`,
		});
});

// ── Global error handler (must be last) ───────────────────
app.use(errorHandler);

module.exports = app;
