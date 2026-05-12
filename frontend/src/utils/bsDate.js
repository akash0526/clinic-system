// frontend/src/utils/bsDate.js
// No external dependencies – uses approximate 57-year offset (BS year = AD year + 57)
// For exact conversions, the backend handles everything via nepali-date-converter.

/**
 * Convert AD date to approximate BS string "YYYY-MM-DD"
 */
export const adToBS = (adDate) => {
	if (!adDate) return null;
	const d = new Date(adDate);
	const bsYear = d.getFullYear() + 57;
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${bsYear}-${month}-${day}`;
};

/**
 * Convert BS string "YYYY-MM-DD" to approximate AD date (returns Date object)
 */
export const bsToAD = (bsString) => {
	if (!bsString) return null;
	const [year, month, day] = bsString.split("-").map(Number);
	const adYear = year - 57;
	return new Date(adYear, month - 1, day);
};

/**
 * Get today's date as a BS string "YYYY-MM-DD"
 */
export const todayBSString = () => {
	return adToBS(new Date());
};

// Alias for compatibility
export const todayBS = todayBSString;
