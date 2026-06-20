// ONE-TIME FIX: sync the BillCounter table to your existing bills.
//
// Why: old bills were numbered with count()+1 before the BillCounter table
// existed. The new counter started at 0, so it tried to reuse numbers that
// already exist ("billNumber already exists"). This script sets each year's
// counter to the highest bill number already used that year.
//
// Run from the backend folder:   node prisma/syncBillCounter.js
// Safe to run multiple times.

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
	const bills = await prisma.bill.findMany({
		select: { billNumber: true },
	});

	if (bills.length === 0) {
		console.log("No existing bills found — nothing to sync.");
		return;
	}

	// Find the highest numeric suffix per year from "INV-<year>-<number>".
	const maxByYear = {}; // { 2026: 7, 2025: 12, ... }

	for (const { billNumber } of bills) {
		const match = /^INV-(\d{4})-(\d+)$/.exec(billNumber || "");
		if (!match) continue;
		const year = parseInt(match[1], 10);
		const num = parseInt(match[2], 10);
		if (!maxByYear[year] || num > maxByYear[year]) {
			maxByYear[year] = num;
		}
	}

	for (const [yearStr, lastNumber] of Object.entries(maxByYear)) {
		const year = parseInt(yearStr, 10);
		await prisma.billCounter.upsert({
			where: { year },
			update: { lastNumber },
			create: { year, lastNumber },
		});
		console.log(
			`✅ Year ${year}: counter set to ${lastNumber} (next bill will be INV-${year}-${String(
				lastNumber + 1,
			).padStart(5, "0")})`,
		);
	}

	console.log("Done. Bill numbering is now in sync.");
}

main()
	.catch((err) => {
		console.error("❌ Sync failed:", err);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
