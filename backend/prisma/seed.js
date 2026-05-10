// Seed script: populates users, inventory items, lab tests, and settings
// Run: node prisma/seed.js

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Seeding database...");

	// ── 1. Users ──────────────────────────────────────────
	const usersToUpsert = [
		{
			email: "admin@clinic.com",
			password: "Admin@12345",
			fullName: "System Administrator",
			fullNameNe: "प्रणाली प्रशासक",
			role: "ADMIN",
		},
		{
			email: "doctor1@clinic.com",
			password: "Doctor@12345",
			fullName: "Dr. Ram Sharma",
			fullNameNe: "डा. राम शर्मा",
			role: "DOCTOR",
			licenseNumber: "NMC-12345",
			specialization: "General Medicine",
		},
		{
			email: "doctor2@clinic.com",
			password: "Doctor@12345",
			fullName: "Dr. Sita Rai",
			fullNameNe: "डा. सीता राई",
			role: "DOCTOR",
			licenseNumber: "NMC-54321",
			specialization: "Pediatrics",
		},
		{
			email: "reception@clinic.com",
			password: "Staff@12345",
			fullName: "Gita Thapa",
			fullNameNe: "गीता थापा",
			role: "RECEPTIONIST",
		},
		{
			email: "labtech@clinic.com",
			password: "Lab@12345",
			fullName: "Hari KC",
			fullNameNe: "हरि के.सी.",
			role: "LAB_TECH",
		},
	];

	for (const u of usersToUpsert) {
		const hash = await bcrypt.hash(u.password, 12);
		await prisma.user.upsert({
			where: {
				email: u.email, // Use u.email instead of hardcoding "admin@clinic.com"
			},
			update: {},
			create: {
				email: u.email,
				// REMOVE the 'password' line here
				passwordHash: hash, // Use the hash you just generated above
				fullName: u.fullName,
				fullNameNe: u.fullNameNe,
				role: u.role,
			},
		});
	}

	// ── 2. Clinic Settings (avoid duplicates) ────────────
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
			description: "Address",
		},
		{ key: "clinic_phone", value: "01-4000000", description: "Phone" },
		{ key: "clinic_email", value: "info@clinic.com", description: "Email" },
		{ key: "pan_number", value: "", description: "PAN/VAT" },
		{ key: "currency", value: "NPR", description: "Currency" },
		{ key: "tax_percent", value: "0", description: "Tax %" },
		{
			key: "appointment_duration",
			value: "15",
			description: "Appt duration (min)",
		},
		{ key: "working_hours_start", value: "09:00", description: "Opening time" },
		{ key: "working_hours_end", value: "17:00", description: "Closing time" },
		{
			key: "working_days",
			value: "Sun,Mon,Tue,Wed,Thu,Fri",
			description: "Working days",
		},
		{
			key: "consultation_fee",
			value: "500",
			description: "Consultation fee (NPR)",
		},
		{ key: "invoice_prefix", value: "INV", description: "Invoice prefix" },
		{
			key: "patient_code_prefix",
			value: "P",
			description: "Patient code prefix",
		},
		{ key: "sms_enabled", value: "false", description: "SMS enabled" },
		{ key: "print_logo", value: "true", description: "Print logo on bills" },
	];

	for (const s of settings) {
		await prisma.clinicSettings.upsert({
			where: { key: s.key },
			update: {},
			create: s,
		});
	}
	console.log(`⚙️  ${settings.length} clinic settings seeded`);

	// ── 3. Inventory Items ────────────────────────────────
	const inventoryItems = [
		{
			itemCode: "MED-001",
			name: "Paracetamol 500mg",
			genericName: "Paracetamol",
			category: "MEDICINE",
			unit: "tablet",
			purchasePrice: 1.5,
			sellingPrice: 3,
			currentStock: 500,
			minimumStock: 50,
		},
		{
			itemCode: "MED-002",
			name: "Amoxicillin 500mg",
			genericName: "Amoxicillin",
			category: "MEDICINE",
			unit: "capsule",
			purchasePrice: 8,
			sellingPrice: 15,
			currentStock: 200,
			minimumStock: 30,
		},
		{
			itemCode: "MED-003",
			name: "Metformin 500mg",
			genericName: "Metformin",
			category: "MEDICINE",
			unit: "tablet",
			purchasePrice: 4,
			sellingPrice: 8,
			currentStock: 300,
			minimumStock: 50,
		},
		{
			itemCode: "MED-004",
			name: "Amlodipine 5mg",
			genericName: "Amlodipine",
			category: "MEDICINE",
			unit: "tablet",
			purchasePrice: 5,
			sellingPrice: 10,
			currentStock: 200,
			minimumStock: 30,
		},
		{
			itemCode: "MED-005",
			name: "Cetirizine 10mg",
			genericName: "Cetirizine",
			category: "MEDICINE",
			unit: "tablet",
			purchasePrice: 3,
			sellingPrice: 6,
			currentStock: 400,
			minimumStock: 30,
		},
		{
			itemCode: "MED-006",
			name: "Omeprazole 20mg",
			genericName: "Omeprazole",
			category: "MEDICINE",
			unit: "capsule",
			purchasePrice: 6,
			sellingPrice: 12,
			currentStock: 250,
			minimumStock: 40,
		},
		{
			itemCode: "MED-007",
			name: "Ibuprofen 400mg",
			genericName: "Ibuprofen",
			category: "MEDICINE",
			unit: "tablet",
			purchasePrice: 4,
			sellingPrice: 8,
			currentStock: 350,
			minimumStock: 40,
		},
		{
			itemCode: "MED-008",
			name: "ORS Sachet",
			genericName: "Oral Rehydration",
			category: "MEDICINE",
			unit: "sachet",
			purchasePrice: 10,
			sellingPrice: 20,
			currentStock: 100,
			minimumStock: 20,
		},
		{
			itemCode: "CON-001",
			name: "Surgical Gloves (M)",
			genericName: null,
			category: "CONSUMABLE",
			unit: "pair",
			purchasePrice: 15,
			sellingPrice: 30,
			currentStock: 100,
			minimumStock: 20,
		},
		{
			itemCode: "CON-002",
			name: "Syringe 5ml",
			genericName: null,
			category: "CONSUMABLE",
			unit: "piece",
			purchasePrice: 8,
			sellingPrice: 15,
			currentStock: 200,
			minimumStock: 50,
		},
		{
			itemCode: "CON-003",
			name: 'Bandage Roll 4"',
			genericName: null,
			category: "CONSUMABLE",
			unit: "piece",
			purchasePrice: 20,
			sellingPrice: 40,
			currentStock: 50,
			minimumStock: 10,
		},
		{
			itemCode: "CON-004",
			name: "Cotton Roll 50g",
			genericName: null,
			category: "CONSUMABLE",
			unit: "roll",
			purchasePrice: 30,
			sellingPrice: 60,
			currentStock: 30,
			minimumStock: 5,
		},
		{
			itemCode: "EQP-001",
			name: "Stethoscope",
			genericName: null,
			category: "EQUIPMENT",
			unit: "piece",
			purchasePrice: 1500,
			sellingPrice: 2500,
			currentStock: 2,
			minimumStock: 1,
		},
		{
			itemCode: "EQP-002",
			name: "Blood Pressure Monitor",
			genericName: null,
			category: "EQUIPMENT",
			unit: "piece",
			purchasePrice: 2000,
			sellingPrice: 3500,
			currentStock: 3,
			minimumStock: 1,
		},
		{
			itemCode: "EQP-003",
			name: "Thermometer (Digital)",
			genericName: null,
			category: "EQUIPMENT",
			unit: "piece",
			purchasePrice: 200,
			sellingPrice: 400,
			currentStock: 10,
			minimumStock: 2,
		},
	];

	for (const item of inventoryItems) {
		await prisma.inventoryItem.upsert({
			where: { itemCode: item.itemCode },
			update: {},
			create: item,
		});
	}
	console.log(`📦 ${inventoryItems.length} inventory items seeded`);

	// ── 4. Lab Tests ──────────────────────────────────────
	const labTests = [
		{
			testCode: "CBC",
			testName: "Complete Blood Count",
			category: "HEMATOLOGY",
			price: 350,
			normalRange: "See report",
			unit: "",
		},
		{
			testCode: "BG",
			testName: "Blood Group & Rh Factor",
			category: "HEMATOLOGY",
			price: 150,
			normalRange: "A/B/AB/O ±",
			unit: "",
		},
		{
			testCode: "FBS",
			testName: "Fasting Blood Sugar",
			category: "BIOCHEMISTRY",
			price: 120,
			normalRange: "70-100",
			unit: "mg/dL",
		},
		{
			testCode: "RBS",
			testName: "Random Blood Sugar",
			category: "BIOCHEMISTRY",
			price: 100,
			normalRange: "<140",
			unit: "mg/dL",
		},
		{
			testCode: "HBA1C",
			testName: "HbA1c",
			category: "BIOCHEMISTRY",
			price: 600,
			normalRange: "<5.7%",
			unit: "%",
		},
		{
			testCode: "CREAT",
			testName: "Serum Creatinine",
			category: "BIOCHEMISTRY",
			price: 200,
			normalRange: "0.6-1.2",
			unit: "mg/dL",
		},
		{
			testCode: "UREA",
			testName: "Blood Urea",
			category: "BIOCHEMISTRY",
			price: 180,
			normalRange: "15-45",
			unit: "mg/dL",
		},
		{
			testCode: "SGPT",
			testName: "SGPT (ALT)",
			category: "BIOCHEMISTRY",
			price: 200,
			normalRange: "7-56",
			unit: "U/L",
		},
		{
			testCode: "SGOT",
			testName: "SGOT (AST)",
			category: "BIOCHEMISTRY",
			price: 200,
			normalRange: "10-40",
			unit: "U/L",
		},
		{
			testCode: "LFT",
			testName: "Liver Function Test",
			category: "BIOCHEMISTRY",
			price: 800,
			normalRange: "See report",
			unit: "",
		},
		{
			testCode: "KFT",
			testName: "Kidney Function Test",
			category: "BIOCHEMISTRY",
			price: 700,
			normalRange: "See report",
			unit: "",
		},
		{
			testCode: "LIPID",
			testName: "Lipid Profile",
			category: "BIOCHEMISTRY",
			price: 700,
			normalRange: "See report",
			unit: "",
		},
		{
			testCode: "TSH",
			testName: "Thyroid Stimulating Hormone",
			category: "ENDOCRINOLOGY",
			price: 700,
			normalRange: "0.4-4.0",
			unit: "mIU/L",
		},
		{
			testCode: "UA",
			testName: "Urine Analysis (R/E)",
			category: "URINALYSIS",
			price: 150,
			normalRange: "See report",
			unit: "",
		},
		{
			testCode: "PREG",
			testName: "Pregnancy Test (Urine)",
			category: "SEROLOGY",
			price: 200,
			normalRange: "Negative",
			unit: "",
		},
		{
			testCode: "DENGUE",
			testName: "Dengue NS1 Antigen",
			category: "SEROLOGY",
			price: 800,
			normalRange: "Negative",
			unit: "",
		},
		{
			testCode: "TYPHOID",
			testName: "Widal Test",
			category: "SEROLOGY",
			price: 250,
			normalRange: "<1:80",
			unit: "",
		},
		{
			testCode: "MALARIA",
			testName: "Malaria (RDT)",
			category: "SEROLOGY",
			price: 300,
			normalRange: "Negative",
			unit: "",
		},
		{
			testCode: "HBSAG",
			testName: "HBsAg (Hepatitis B)",
			category: "SEROLOGY",
			price: 400,
			normalRange: "Non-reactive",
			unit: "",
		},
		{
			testCode: "HCV",
			testName: "Anti-HCV",
			category: "SEROLOGY",
			price: 500,
			normalRange: "Non-reactive",
			unit: "",
		},
		{
			testCode: "HIV",
			testName: "HIV Rapid Test",
			category: "SEROLOGY",
			price: 400,
			normalRange: "Non-reactive",
			unit: "",
		},
		{
			testCode: "XRAY",
			testName: "Chest X-Ray",
			category: "RADIOLOGY",
			price: 500,
			normalRange: "Normal",
			unit: "",
		},
		{
			testCode: "USG",
			testName: "Ultrasound Abdomen",
			category: "RADIOLOGY",
			price: 1000,
			normalRange: "Normal",
			unit: "",
		},
	];

	for (const test of labTests) {
		await prisma.labTest.upsert({
			where: { testCode: test.testCode },
			update: {},
			create: test,
		});
	}
	console.log(`🔬 ${labTests.length} lab tests seeded`);

	// ── 5. SMS Templates ───────────────────────────────────
	const templates = [
		{
			name: "APPOINTMENT_REMINDER",
			templateEn:
				"Dear {{patientName}}, your appointment with Dr. {{doctorName}} is on {{date}} at {{time}}. Please arrive 10 mins early. - {{clinicName}}",
			templateNe:
				"प्रिय {{patientName}}, तपाईंको डा. {{doctorName}} सँग {{date}} को {{time}} मा अपोइन्टमेन्ट छ। कृपया १० मिनेट अगाडि आउनुहोस्। - {{clinicName}}",
		},
		{
			name: "LAB_RESULT_READY",
			templateEn:
				"Dear {{patientName}}, your lab results are ready. Please visit {{clinicName}} to collect your report. Contact: {{clinicPhone}}",
			templateNe:
				"प्रिय {{patientName}}, तपाईंको ल्याब रिपोर्ट तयार छ। रिपोर्ट लिन {{clinicName}} मा आउनुहोस्। सम्पर्क: {{clinicPhone}}",
		},
	];

	for (const t of templates) {
		await prisma.smsTemplate.upsert({
			where: { name: t.name },
			update: {},
			create: t,
		});
	}
	console.log(`✉️  ${templates.length} SMS templates seeded`);

	console.log("\n🎉 Seed complete!");
	console.log("─".repeat(50));
	console.log("Login credentials:");
	console.log("  Admin:        admin@clinic.com      / Admin@12345");
	console.log("  Doctor:       doctor1@clinic.com    / Doctor@12345");
	console.log("  Doctor:       doctor2@clinic.com    / Doctor@12345");
	console.log("  Receptionist: reception@clinic.com  / Staff@12345");
	console.log("  Lab Tech:     labtech@clinic.com    / Lab@12345");
	console.log("─".repeat(50));
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
