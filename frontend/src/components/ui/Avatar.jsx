import { cn } from "../../utils/cn";

const SIZES = {
	xs: "h-6 w-6 text-[10px]",
	sm: "h-8 w-8 text-xs",
	md: "h-10 w-10 text-sm",
	lg: "h-14 w-14 text-lg",
};

const PALETTE = [
	"bg-brand-50 text-brand-700",
	"bg-sky-50 text-sky-700",
	"bg-violet-50 text-violet-700",
	"bg-amber-50 text-amber-700",
	"bg-emerald-50 text-emerald-700",
	"bg-pink-50 text-pink-700",
];

const initials = (name = "") =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((n) => n[0])
		.join("")
		.toUpperCase() || "?";

const hashCode = (str = "") =>
	[...str].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

export const Avatar = ({ name = "", size = "sm", className }) => (
	<span
		className={cn(
			"inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-slate-900/5",
			SIZES[size],
			PALETTE[hashCode(name) % PALETTE.length],
			className,
		)}
		title={name}
	>
		{initials(name)}
	</span>
);

export default Avatar;
