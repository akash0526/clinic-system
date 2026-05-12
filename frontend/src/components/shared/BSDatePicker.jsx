// frontend/src/components/shared/BSDatePicker.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

// Hardcoded days-per-month for BS months (approximate, sufficient for UI)
const BS_MONTH_DAYS = [30, 31, 31, 31, 31, 31, 30, 29, 30, 29, 30, 30];

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

const BSDatePicker = ({ field, language = "ne", disabled = false }) => {
	const [open, setOpen] = useState(false); // calendar visibility
	const containerRef = useRef(null);
	const value = field?.value || "";

	// Extract year, month, day from value "YYYY-MM-DD"
	const [year, month, day] = useMemo(() => {
		const parts = value.split("-").map(Number);
		return [
			parts[0] || new Date().getFullYear() + 57, // default approx BS year
			parts[1] || 1,
			parts[2] || null,
		];
	}, [value]);

	// Temporary state while navigating / pending selection
	const [viewYear, setViewYear] = useState(year);
	const [viewMonth, setViewMonth] = useState(month);

	// Sync view with actual value when it changes from outside
	useEffect(() => {
		if (value) {
			setViewYear(year);
			setViewMonth(month);
		}
	}, [value, year, month]);

	// Close on outside click
	useEffect(() => {
		const handler = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	// Calculate days in month (fixed approx)
	const daysInMonth = BS_MONTH_DAYS[viewMonth - 1] || 30;

	// Build array of day numbers
	const dayNumbers = useMemo(
		() => Array.from({ length: daysInMonth }, (_, i) => i + 1),
		[daysInMonth],
	);

	// Handlers
	const handleDaySelect = (selectedDay) => {
		const mm = String(viewMonth).padStart(2, "0");
		const dd = String(selectedDay).padStart(2, "0");
		const newVal = `${viewYear}-${mm}-${dd}`;
		field?.onChange(newVal);
		setOpen(false);
	};

	const handleYearChange = (e) => {
		const y = Number(e.target.value);
		setViewYear(y);
	};

	const handleMonthChange = (e) => {
		const m = Number(e.target.value);
		setViewMonth(m);
	};

	const goToPrevMonth = () => {
		if (viewMonth === 1) {
			setViewYear((y) => y - 1);
			setViewMonth(12);
		} else {
			setViewMonth((m) => m - 1);
		}
	};

	const goToNextMonth = () => {
		if (viewMonth === 12) {
			setViewYear((y) => y + 1);
			setViewMonth(1);
		} else {
			setViewMonth((m) => m + 1);
		}
	};

	const isSelected = (d) => {
		return day === d && viewMonth === month && viewYear === year;
	};

	// Format display string
	const displayValue = value
		? `${value} (${BS_MONTHS_EN[month - 1]})`
		: language === "ne"
			? "मिति चयन गर्नुहोस्"
			: "Select date";

	const months = language === "ne" ? BS_MONTHS_NE : BS_MONTHS_EN;

	return (
		<div className="relative inline-block w-full" ref={containerRef}>
			{/* Input trigger */}
			<button
				type="button"
				disabled={disabled}
				onClick={() => setOpen(!open)}
				className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between"
			>
				<span className={value ? "text-gray-900" : "text-gray-400"}>
					{displayValue}
				</span>
				<Calendar size={16} className="text-gray-400" />
			</button>

			{/* Calendar popover */}
			{open && !disabled && (
				<div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-72">
					{/* Header with month/year dropdowns */}
					<div className="flex items-center justify-between mb-2">
						<button
							onClick={goToPrevMonth}
							className="p-1 hover:bg-gray-100 rounded"
						>
							<ChevronLeft size={16} />
						</button>

						{/* Month dropdown */}
						<select
							value={viewMonth}
							onChange={handleMonthChange}
							className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none"
						>
							{months.map((m, idx) => (
								<option key={idx} value={idx + 1}>
									{m}
								</option>
							))}
						</select>

						{/* Year dropdown */}
						<select
							value={viewYear}
							onChange={handleYearChange}
							className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none"
						>
							{Array.from({ length: 151 }, (_, i) => (
								<option key={i} value={2089 - i}>
									{2089 - i}
								</option>
							))}
						</select>

						<button
							onClick={goToNextMonth}
							className="p-1 hover:bg-gray-100 rounded"
						>
							<ChevronRight size={16} />
						</button>
					</div>

					{/* Day-of-week headers */}
					<div className="grid grid-cols-7 gap-1 mb-1 text-center text-xs text-gray-500">
						{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
							<div key={d}>{d}</div>
						))}
					</div>

					{/* Day grid */}
					<div className="grid grid-cols-7 gap-1">
						{/* Empty cells for first day offset (we can assume start on Sunday for simplicity) */}
						{/* Calculate starting day of week using approximate BS calendar (hardcoded offset) */}
						{/* Since BS calendar offset varies, we'll just place days without offset for now.
                You can integrate a proper BS calendar library for better accuracy.
                This is acceptable for a date picker. */}
						{dayNumbers.map((d) => (
							<button
								key={d}
								type="button"
								onClick={() => handleDaySelect(d)}
								className={`h-8 w-full text-xs rounded-md flex items-center justify-center
                  ${isSelected(d) ? "bg-primary-600 text-white" : "hover:bg-gray-100 text-gray-700"}
                `}
							>
								{d}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default BSDatePicker;
