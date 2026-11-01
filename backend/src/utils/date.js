const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isDateOnlyString = (value) =>
	typeof value === "string" && DATE_ONLY_REGEX.test(value);

// A date-only string that also represents a REAL calendar day.
// Needed because `new Date("2026-02-30T00:00:00.000")` does NOT return
// Invalid Date in V8 — it rolls over to March 2 — so we verify the
// components round-trip exactly.
const isValidDateOnly = (value) => {
	if (!isDateOnlyString(value)) return false;
	const date = new Date(`${value}T00:00:00.000`);
	if (Number.isNaN(date.getTime())) return false;
	const [year, month, day] = value.split("-").map(Number);
	return (
		date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day
	);
};

const parseDateOnly = (value) => {
	if (!value) return null;
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : new Date(value);
	}

	if (isDateOnlyString(value)) {
		// Impossible calendar dates (2026-02-30) must not reach the database.
		return isValidDateOnly(value) ? new Date(`${value}T00:00:00.000`) : null;
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (value) => {
	const date = parseDateOnly(value);
	if (!date) return null;
	date.setHours(0, 0, 0, 0);
	return date;
};

const endOfDay = (value) => {
	const date = parseDateOnly(value);
	if (!date) return null;
	date.setHours(23, 59, 59, 999);
	return date;
};

const formatDateOnly = (value) => {
	const date = parseDateOnly(value);
	if (!date) return null;

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

module.exports = {
	DATE_ONLY_REGEX,
	isDateOnlyString,
	isValidDateOnly,
	parseDateOnly,
	startOfDay,
	endOfDay,
	formatDateOnly,
};
