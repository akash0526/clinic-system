export const formatDate = (value, locale = "en-US") => {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

export const toDateInputValue = (value) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const todayDateInputValue = () => toDateInputValue(new Date());

export const calculateAge = (value) => {
	if (!value) return null;
	const dob = new Date(value);
	if (Number.isNaN(dob.getTime())) return null;

	const today = new Date();
	let age = today.getFullYear() - dob.getFullYear();
	const monthDiff = today.getMonth() - dob.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
		age -= 1;
	}

	return age >= 0 && age < 150 ? age : null;
};
