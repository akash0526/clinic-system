require("dotenv").config();
const app = require("./src/app");
const prisma = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const start = async () => {
	try {
		// Verify database connection
		await prisma.$connect();
		console.log("✅ Database connected");

		app.listen(PORT, () => {
			console.log(`🏥 Clinic API running on port ${PORT}`);
			console.log(`📊 Environment: ${process.env.NODE_ENV}`);
		});
	} catch (err) {
		console.error("❌ Failed to start server:", err);
		process.exit(1);
	}
};

// Graceful shutdown
process.on("SIGINT", async () => {
	await prisma.$disconnect();
	process.exit(0);
});

start();
