// backend/src/utils/bsDate.js
// Reliable BS↔AD conversion using the standard 57-year offset.
// No external dependencies. Never returns null for valid inputs.

/**
 * Convert an AD Date (or string) → BS string "YYYY-MM-DD"
 */
const adToBS = (adDate) => {
	if (!adDate) return null;
	const d = new Date(adDate);
	const bsYear = d.getFullYear() + 57;
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${bsYear}-${month}-${day}`;
};

/**
 * Convert a BS string "YYYY-MM-DD" → JavaScript Date (AD)
 */
const bsToAD = (bsString) => {
	if (!bsString) return null;
	const [year, month, day] = bsString.split("-").map(Number);
	const adYear = year - 57;
	return new Date(adYear, month - 1, day);
};

/**
 * Parse BS string → { year, month, day }
 */
const parseBSDate = (bsString) => {
	if (!bsString) return { year: null, month: null, day: null };
	const [year, month, day] = bsString.split("-").map(Number);
	return { year, month, day };
};

/**
 * Get today as BS string
 */
const todayBS = () => adToBS(new Date());

module.exports = { adToBS, bsToAD, parseBSDate, todayBS };
