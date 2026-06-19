const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isDateOnlyString = (value) =>
	typeof value === "string" && DATE_ONLY_REGEX.test(value);

const parseDateOnly = (value) => {
	if (!value) return null;
	if (value instanceof Date) return new Date(value);

	if (isDateOnlyString(value)) {
		return new Date(`${value}T00:00:00.000`);
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
	parseDateOnly,
	startOfDay,
	endOfDay,
	formatDateOnly,
};
