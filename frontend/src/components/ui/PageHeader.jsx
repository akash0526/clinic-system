import { cn } from "../../utils/cn";

const PageHeader = ({ title, description, eyebrow, actions, className, children }) => (
	<div
		className={cn(
			"mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
			className,
		)}
	>
		<div className="min-w-0">
			{eyebrow && (
				<p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
					{eyebrow}
				</p>
			)}
			<h1 className="truncate text-[22px] font-semibold leading-tight text-slate-900 sm:text-2xl">
				{title}
			</h1>
			{description && (
				<p className="mt-1 text-sm text-slate-500">{description}</p>
			)}
			{children}
		</div>
		{actions && (
			<div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>
		)}
	</div>
);

export default PageHeader;
