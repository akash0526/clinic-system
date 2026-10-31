import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

const pageWindow = (page, total) => {
	const pages = [];
	const start = Math.max(1, Math.min(page - 1, total - 2));
	for (let i = start; i <= Math.min(total, start + 2); i += 1) pages.push(i);
	return pages;
};

const Pagination = ({ meta, page, setPage, className }) => {
	if (!meta || !meta.total) return null;

	const current = meta.page ?? page ?? 1;
	const totalPages = meta.totalPages ?? 1;
	const limit = meta.limit ?? 20;
	const from = Math.min(meta.total, (current - 1) * limit + 1);
	const to = Math.min(meta.total, current * limit);

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row",
				className,
			)}
		>
			<p className="text-xs text-slate-500">
				Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{" "}
				<span className="font-medium text-slate-700">{meta.total}</span>
			</p>

			{totalPages > 1 && (
				<div className="flex items-center gap-1">
					<button
						onClick={() => setPage(current - 1)}
						disabled={!meta.hasPrev}
						className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
					>
						<ChevronLeft size={14} /> Prev
					</button>

					{pageWindow(current, totalPages).map((p) => (
						<button
							key={p}
							onClick={() => setPage(p)}
							aria-current={p === current ? "page" : undefined}
							className={cn(
								"h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition",
								p === current
									? "bg-brand-600 text-white shadow-sm"
									: "text-slate-600 hover:bg-slate-100",
							)}
						>
							{p}
						</button>
					))}

					<button
						onClick={() => setPage(current + 1)}
						disabled={!meta.hasNext}
						className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
					>
						Next <ChevronRight size={14} />
					</button>
				</div>
			)}
		</div>
	);
};

export default Pagination;
