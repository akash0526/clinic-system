// Centralized environment validation.
// Loaded once at startup so the app FAILS FAST on bad/missing config
// instead of crashing later in a request.

require("dotenv").config();

const REQUIRED = ["DATABASE_URL", "JWT_SECRET"];

const errors = [];

// 1) Required vars must exist
for (const key of REQUIRED) {
	if (!process.env[key] || process.env[key].trim() === "") {
		errors.push(`Missing required env var: ${key}`);
	}
}

// 2) JWT_SECRET must be strong enough
// NOTE: set to 5 for local dev convenience. RAISE THIS BACK TO 32 before any
// real deployment — a short secret is easy to brute-force.
const MIN_JWT_SECRET_LENGTH = 5;
if (
	process.env.JWT_SECRET &&
	process.env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH
) {
	errors.push(
		`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`,
	);
}

// 3) Reject the placeholder secret from .env.example
if (
	process.env.JWT_SECRET ===
	"your-super-secret-jwt-key-minimum-32-characters-long"
) {
	errors.push(
		"JWT_SECRET is still the example placeholder — set a real secret.",
	);
}

// 4) Warn (don't crash) on questionable production settings
const NODE_ENV = process.env.NODE_ENV || "development";
if (NODE_ENV === "production") {
	if (!process.env.FRONTEND_URL) {
		console.warn(
			"⚠️  FRONTEND_URL not set in production — CORS may block your frontend.",
		);
	}
	if ((process.env.FRONTEND_URL || "").startsWith("http://")) {
		console.warn(
			"⚠️  FRONTEND_URL uses http:// in production — use https:// for security.",
		);
	}
}

if (errors.length) {
	console.error("❌ Invalid environment configuration:");
	for (const e of errors) console.error(`   - ${e}`);
	process.exit(1);
}

const env = {
	NODE_ENV,
	PORT: parseInt(process.env.PORT, 10) || 5000,
	DATABASE_URL: process.env.DATABASE_URL,
	JWT_SECRET: process.env.JWT_SECRET,
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
	FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
	COOKIE_SECURE: NODE_ENV === "production",
	SMS_PROVIDER: process.env.SMS_PROVIDER || "dummy",
	SPARROW_SMS_TOKEN: process.env.SPARROW_SMS_TOKEN || "",
	SPARROW_SMS_FROM: process.env.SPARROW_SMS_FROM || "Clinic",
};

module.exports = env;
