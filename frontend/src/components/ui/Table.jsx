import { Inbox, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export const TableWrap = ({ className, children }) => (
	<div className={cn("overflow-x-auto", className)}>
		<table className="w-full border-collapse text-sm">{children}</table>
	</div>
);

export const THead = ({ className, children }) => (
	<thead className={cn("bg-slate-50/80", className)}>{children}</thead>
);

export const TH = ({ className, children, ...props }) => (
	<th
		className={cn(
			"whitespace-nowrap border-b border-slate-200/80 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 first:pl-5 last:pr-5",
			className,
		)}
		{...props}
	>
		{children}
	</th>
);

export const TBody = ({ className, children }) => (
	<tbody className={cn("divide-y divide-slate-100", className)}>{children}</tbody>
);

export const TR = ({ className, children, ...props }) => (
	<tr
		className={cn(
			"group transition-colors duration-150 hover:bg-slate-50/70",
			className,
		)}
		{...props}
	>
		{children}
	</tr>
);

export const TD = ({ className, children, ...props }) => (
	<td
		className={cn("px-4 py-3.5 align-middle text-slate-600 first:pl-5 last:pr-5", className)}
		{...props}
	>
		{children}
	</td>
);

export const TableState = ({ icon: Icon = Inbox, title, description, loading, children }) => (
	<tr>
		<td colSpan={100} className="px-5 py-14">
			<div className="flex flex-col items-center justify-center text-center">
				{loading ? (
					<Loader2 size={22} className="animate-spin text-brand-500" />
				) : (
					<span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
						<Icon size={20} />
					</span>
				)}
				<p className="text-sm font-medium text-slate-700">
					{loading ? "Loading…" : title || "Nothing here yet"}
				</p>
				{!loading && description && (
					<p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
				)}
				{!loading && children}
			</div>
		</td>
	</tr>
);

export default TableWrap;
