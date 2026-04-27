// Seed: creates admin user + default clinic settings + SMS templates

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Seeding database...");

	// ─── Admin User ─────────────────────────────────────────
	const adminHash = await bcrypt.hash("Admin@12345", 12);
	await prisma.user.upsert({
		where: { email: "admin@clinic.com" },
		update: {},
		create: {
			email: "admin@clinic.com",
			passwordHash: adminHash,
			fullName: "System Administrator",
			role: "ADMIN",
			isActive: true,
		},
	});
	console.log("✅ Admin user created: admin@clinic.com / Admin@12345");

	// ─── Clinic Settings ─────────────────────────────────────
	const settings = [
		{
			key: "clinic_name",
			value: "My Clinic",
			description: "Clinic name in English",
		},
		{
			key: "clinic_name_ne",
			value: "मेरो क्लिनिक",
			description: "Clinic name in Nepali",
		},
		{
			key: "clinic_address",
			value: "Kathmandu, Nepal",
			description: "Clinic address",
		},
		{
			key: "clinic_phone",
			value: "01-4000000",
			description: "Main phone number",
		},
		{ key: "pan_number", value: "", description: "PAN/VAT number" },
		{ key: "currency", value: "NPR", description: "Default currency" },
		{ key: "tax_percent", value: "13", description: "VAT percentage" },
		{
			key: "appointment_duration",
			value: "15",
			description: "Default appointment duration (minutes)",
		},
		{
			key: "working_hours_start",
			value: "09:00",
			description: "Clinic opening time",
		},
		{
			key: "working_hours_end",
			value: "17:00",
			description: "Clinic closing time",
		},
	];

	for (const s of settings) {
		await prisma.clinicSettings.upsert({
			where: { key: s.key },
			update: {},
			create: s,
		});
	}
	console.log("✅ Default clinic settings created");

	// ─── SMS Templates ─────────────────────────────────────
	await prisma.smsTemplate.upsert({
		where: { name: "APPOINTMENT_REMINDER" },
		update: {},
		create: {
			name: "APPOINTMENT_REMINDER",
			templateEn:
				"Dear {{patientName}}, your appointment with Dr. {{doctorName}} is scheduled on {{date}} at {{time}}. - {{clinicName}}",
			templateNe:
				"प्रिय {{patientName}}, तपाईंको डा. {{doctorName}} सँग {{date}} को {{time}} मा अपोइन्टमेन्ट छ। - {{clinicName}}",
		},
	});
	console.log("✅ SMS templates seeded");

	console.log("\n🎉 Seeding complete!");
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
