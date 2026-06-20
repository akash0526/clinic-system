// Validate environment FIRST — fails fast on bad config and loads .env.
const env = require("./config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");

// Route modules
const authRoutes = require("./modules/auth/auth.routes");
const patientRoutes = require("./modules/patients/patient.routes");
const appointmentRoutes = require("./modules/appointments/appointment.routes");
const encounterRoutes = require("./modules/encounters/encounter.routes");
const billingRoutes = require("./modules/billing/bill.routes");
const prescriptionRoutes = require("./modules/prescriptions/prescription.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");
const labRoutes = require("./modules/lab/lab.routes");
const userRoutes = require("./modules/users/user.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

const app = express();

// If you later run behind a reverse proxy (nginx, etc.), enable this so req.ip
// and rate limiting use the real client IP. Safe to leave commented for a
// direct Node setup (running `node server.js` without a proxy).
// app.set("trust proxy", 1);

// ── Security & Parsing ────────────────────────────────────
// CSP enabled in production (defense-in-depth against XSS).
app.use(
	helmet({
		contentSecurityPolicy:
			env.NODE_ENV === "production"
				? {
						directives: {
							defaultSrc: ["'self'"],
							scriptSrc: ["'self'"],
							styleSrc: ["'self'", "'unsafe-inline'"],
							imgSrc: ["'self'", "data:", "blob:"],
							connectSrc: ["'self'", env.FRONTEND_URL],
							objectSrc: ["'none'"],
							frameAncestors: ["'none'"],
							upgradeInsecureRequests: [],
						},
					}
				: false, // off in dev for HMR convenience
		crossOriginResourcePolicy: { policy: "same-site" },
	}),
);
app.use(compression());
app.use(
	cors({
		origin: env.FRONTEND_URL,
		credentials: true,
	}),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Rate Limiting ─────────────────────────────────────────
app.use(
	"/api/auth/login",
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 20,
		standardHeaders: true,
		legacyHeaders: false,
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
		standardHeaders: true,
		legacyHeaders: false,
	}),
);

// ── Routes ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/encounters", encounterRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/users", userRoutes);
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
	res.status(404).json({
		success: false,
		message: `Route not found: ${req.method} ${req.path}`,
	});
});

// ── Global error handler (must be last) ───────────────────
app.use(errorHandler);

module.exports = app;
