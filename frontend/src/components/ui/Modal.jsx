import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZES = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-2xl",
	"2xl": "max-w-4xl",
};

const Modal = ({
	open = true,
	onClose,
	title,
	description,
	icon: Icon,
	size = "lg",
	footer,
	children,
	className,
}) => {
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => e.key === "Escape" && onClose?.();
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [open, onClose]);

	if (!open) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
			<div
				className="fixed inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]"
				onClick={onClose}
				aria-hidden="true"
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={typeof title === "string" ? title : "Dialog"}
				className={cn(
					"relative my-auto w-full animate-scale-in rounded-2xl border border-slate-200/70 bg-white shadow-pop",
					SIZES[size],
					className,
				)}
			>
				{(title || onClose) && (
					<div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
						{Icon && (
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
								<Icon size={18} />
							</span>
						)}
						<div className="min-w-0 flex-1">
							{title && (
								<h2 className="text-base font-semibold text-slate-900">{title}</h2>
							)}
							{description && (
								<p className="mt-0.5 text-xs text-slate-500">{description}</p>
							)}
						</div>
						{onClose && (
							<button
								onClick={onClose}
								className="-mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
								aria-label="Close"
							>
								<X size={18} />
							</button>
						)}
					</div>
				)}

				<div className="px-5 py-5">{children}</div>

				{footer && (
					<div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
						{footer}
					</div>
				)}
			</div>
		</div>,
		document.body,
	);
};

export default Modal;
