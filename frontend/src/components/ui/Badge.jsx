import { cn } from "../../utils/cn";

const TONES = {
	neutral: "bg-slate-100 text-slate-600 ring-slate-200/70",
	brand: "bg-brand-50 text-brand-700 ring-brand-200/70",
	blue: "bg-sky-50 text-sky-700 ring-sky-200/70",
	green: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
	amber: "bg-amber-50 text-amber-700 ring-amber-200/70",
	orange: "bg-orange-50 text-orange-700 ring-orange-200/70",
	red: "bg-rose-50 text-rose-700 ring-rose-200/70",
	purple: "bg-violet-50 text-violet-700 ring-violet-200/70",
	pink: "bg-pink-50 text-pink-700 ring-pink-200/70",
};

const SIZES = {
	sm: "px-2 py-0.5 text-[11px] gap-1",
	md: "px-2.5 py-1 text-xs gap-1.5",
};

export const Badge = ({ tone = "neutral", size = "md", dot = false, className, children }) => (
	<span
		className={cn(
			"inline-flex items-center whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
			TONES[tone] || TONES.neutral,
			SIZES[size],
			className,
		)}
	>
		{dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
		{children}
	</span>
);

export const STATUS_TONES = {
	SCHEDULED: "blue",
	CONFIRMED: "green",
	IN_PROGRESS: "amber",
	COMPLETED: "neutral",
	CANCELLED: "red",
	NO_SHOW: "orange",
	PAID: "green",
	PENDING: "amber",
	PARTIAL: "blue",
	DRAFT: "neutral",
	ACTIVE: "green",
	INACTIVE: "neutral",
	NORMAL: "green",
	HIGH: "orange",
	CRITICAL: "red",
	LOW: "blue",
};

/** Human-friendly status chip. Falls back to a neutral tone. */
export const StatusBadge = ({ status, className }) => {
	if (!status) return <span className="text-slate-400">—</span>;
	const label = String(status).replaceAll("_", " ");
	return (
		<Badge
			tone={STATUS_TONES[status] || "neutral"}
			dot
			size="sm"
			className={cn("capitalize", className)}
		>
			{label.toLowerCase()}
		</Badge>
	);
};

export default Badge;
