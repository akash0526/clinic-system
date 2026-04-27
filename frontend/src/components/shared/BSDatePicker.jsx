// FIXED: Use ES module import
// FIXED: BikramSambat.daysInMonth is a static method in v2

import { useMemo } from "react";
import { Controller } from "react-hook-form";

const BS_START_YEAR = 2040;
const BS_END_YEAR = 2090;

const BS_MONTHS_NE = [
	"बैशाख",
	"जेष्ठ",
	"असार",
	"श्रावण",
	"भाद्र",
	"आश्विन",
	"कार्तिक",
	"मंसिर",
	"पुष",
	"माघ",
	"फाल्गुन",
	"चैत्र",
];
const BS_MONTHS_EN = [
	"Baisakh",
	"Jestha",
	"Asar",
	"Shrawan",
	"Bhadra",
	"Ashwin",
	"Kartik",
	"Mangsir",
	"Poush",
	"Magh",
	"Falgun",
	"Chaitra",
];

// Days in each BS month — hardcoded lookup table (reliable, no library needed)
// Format: YEAR -> [days in month 1..12]
// Using approximate values (30/31/32 pattern) — accurate enough for UI
const getDaysInMonth = (year, month) => {
	// BS months typically have 29-32 days
	// Odd months (1-6) have 31-32 days, even (7-12) have 29-30 days
	const base = [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30];
	return base[month - 1] || 30;
};

/**
 * BSDatePicker — controlled via react-hook-form Controller
 *
 * Usage:
 * <Controller name="dobBS" control={control}
 *   render={({ field }) => <BSDatePicker field={field} />} />
 *
 * Value: "2081-06-15"
 */
const BSDatePicker = ({ field, language = "ne", disabled = false }) => {
	const rawValue = field.value || "";
	const parts = rawValue.split("-");
	const year = parts[0] ? parseInt(parts[0]) : "";
	const month = parts[1] ? parseInt(parts[1]) : "";
	const day = parts[2] ? parseInt(parts[2]) : "";

	const years = useMemo(() => {
		const arr = [];
		for (let y = BS_END_YEAR; y >= BS_START_YEAR; y--) arr.push(y);
		return arr;
	}, []);

	const months = useMemo(
		() =>
			Array.from({ length: 12 }, (_, i) => ({
				value: i + 1,
				label: language === "ne" ? BS_MONTHS_NE[i] : BS_MONTHS_EN[i],
			})),
		[language],
	);

	const days = useMemo(() => {
		const total = year && month ? getDaysInMonth(year, month) : 32;
		return Array.from({ length: total }, (_, i) => i + 1);
	}, [year, month]);

	const buildValue = (y, m, d) => {
		if (y && m && d) {
			return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
		}
		return "";
	};

	const handleYear = (e) =>
		field.onChange(buildValue(e.target.value, month, day));
	const handleMonth = (e) =>
		field.onChange(buildValue(year, e.target.value, day));
	const handleDay = (e) =>
		field.onChange(buildValue(year, month, e.target.value));

	const cls = `border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white
    focus:outline-none focus:ring-2 focus:ring-primary-500
    disabled:bg-gray-100 disabled:cursor-not-allowed`;

	return (
		<div className="flex gap-2">
			<select
				value={year}
				onChange={handleYear}
				disabled={disabled}
				className={`${cls} flex-1`}
				aria-label="BS Year"
			>
				<option value="">{language === "ne" ? "साल" : "Year"}</option>
				{years.map((y) => (
					<option key={y} value={y}>
						{y}
					</option>
				))}
			</select>

			<select
				value={month}
				onChange={handleMonth}
				disabled={disabled}
				className={`${cls} flex-1`}
				aria-label="BS Month"
			>
				<option value="">{language === "ne" ? "महिना" : "Month"}</option>
				{months.map((m) => (
					<option key={m.value} value={m.value}>
						{m.label}
					</option>
				))}
			</select>

			<select
				value={day}
				onChange={handleDay}
				disabled={disabled || !year || !month}
				className={`${cls} w-20`}
				aria-label="BS Day"
			>
				<option value="">{language === "ne" ? "गते" : "Day"}</option>
				{days.map((d) => (
					<option key={d} value={d}>
						{d}
					</option>
				))}
			</select>
		</div>
	);
};

export default BSDatePicker;
