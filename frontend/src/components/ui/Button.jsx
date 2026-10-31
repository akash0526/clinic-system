import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

const VARIANTS = {
	primary:
		"bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
	secondary:
		"border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100",
	soft: "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200/70",
	ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
	danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800",
	"danger-soft": "bg-rose-50 text-rose-600 hover:bg-rose-100",
	success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
	dark: "bg-slate-900 text-white shadow-sm hover:bg-slate-800",
	link: "text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline",
};

const SIZES = {
	xs: "h-7 gap-1.5 rounded-lg px-2.5 text-xs",
	sm: "h-9 gap-1.5 rounded-xl px-3 text-[13px]",
	md: "h-10 gap-2 rounded-xl px-4 text-sm",
	lg: "h-11 gap-2 rounded-xl px-5 text-sm",
	icon: "h-9 w-9 rounded-xl",
	"icon-sm": "h-8 w-8 rounded-lg",
};

const Button = forwardRef(
	(
		{
			as: Tag = "button",
			variant = "primary",
			size = "md",
			loading = false,
			icon: Icon,
			iconRight: IconRight,
			className,
			children,
			disabled,
			type = "button",
			...props
		},
		ref,
	) => (
		<Tag
			ref={ref}
			type={Tag === "button" ? type : undefined}
			disabled={Tag === "button" ? disabled || loading : undefined}
			className={cn(
				"inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition duration-150 ease-smooth focus-visible:ring-4 focus-visible:ring-brand-500/20",
				"disabled:pointer-events-none disabled:opacity-50",
				SIZES[size],
				VARIANTS[variant],
				className,
			)}
			{...props}
		>
			{loading ? (
				<Loader2 size={16} className="animate-spin" />
			) : (
				Icon && <Icon size={size === "xs" ? 14 : 16} strokeWidth={2.1} />
			)}
			{children}
			{IconRight && !loading && (
				<IconRight size={16} strokeWidth={2.1} className="opacity-70" />
			)}
		</Tag>
	),
);

Button.displayName = "Button";

export default Button;
