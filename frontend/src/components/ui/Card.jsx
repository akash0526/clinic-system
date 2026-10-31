import { cn } from "../../utils/cn";

export const Card = ({ className, hover = false, children, ...props }) => (
	<div
		className={cn(
			"rounded-2xl border border-slate-200/80 bg-white shadow-soft",
			hover &&
				"transition duration-200 ease-smooth hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-card",
			className,
		)}
		{...props}
	>
		{children}
	</div>
);

export const CardHeader = ({ className, title, subtitle, icon: Icon, action, children }) => (
	<div
		className={cn(
			"flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4",
			className,
		)}
	>
		<div className="flex min-w-0 items-start gap-3">
			{Icon && (
				<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
					<Icon size={16} strokeWidth={2.1} />
				</span>
			)}
			<div className="min-w-0">
				{title && <h3 className="truncate text-[15px] font-semibold text-slate-900">{title}</h3>}
				{subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
				{children}
			</div>
		</div>
		{action && <div className="shrink-0">{action}</div>}
	</div>
);

export const CardBody = ({ className, children, ...props }) => (
	<div className={cn("px-5 py-4", className)} {...props}>
		{children}
	</div>
);

export const CardFooter = ({ className, children, ...props }) => (
	<div
		className={cn("border-t border-slate-100 px-5 py-3.5", className)}
		{...props}
	>
		{children}
	</div>
);

export default Card;
