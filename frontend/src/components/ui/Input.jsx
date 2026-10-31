import { forwardRef, useId } from "react";
import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

const base =
	"block w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition duration-150 hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50 disabled:text-slate-500";

export const Field = ({ label, htmlFor, required, hint, error, className, children }) => (
	<div className={className}>
		{label && (
			<label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-slate-700">
				{label}
				{required && <span className="ml-0.5 text-rose-500">*</span>}
			</label>
		)}
		{children}
		{error ? (
			<p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
		) : (
			hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
		)}
	</div>
);

const Input = forwardRef(
	({ label, error, hint, icon: Icon, className, wrapperClassName, id, required, ...props }, ref) => {
		const autoId = useId();
		const inputId = id || autoId;
		const input = (
			<div className="relative">
				{Icon && (
					<Icon
						size={16}
						className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
					/>
				)}
				<input
					ref={ref}
					id={inputId}
					required={required}
					className={cn(
						base,
						"h-10 px-3.5 py-2",
						Icon && "pl-10",
						error && "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10",
						className,
					)}
					{...props}
				/>
			</div>
		);

		if (!label && !error && !hint) return input;

		return (
			<Field
				label={label}
				htmlFor={inputId}
				required={required}
				hint={hint}
				error={error}
				className={wrapperClassName}
			>
				{input}
			</Field>
		);
	},
);
Input.displayName = "Input";

export const Textarea = forwardRef(
	({ label, error, hint, className, id, required, rows = 3, ...props }, ref) => {
		const autoId = useId();
		const inputId = id || autoId;
		const area = (
			<textarea
				ref={ref}
				id={inputId}
				required={required}
				rows={rows}
				className={cn(
					base,
					"resize-none px-3.5 py-2.5 leading-relaxed",
					error && "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10",
					className,
				)}
				{...props}
			/>
		);

		if (!label && !error && !hint) return area;

		return (
			<Field label={label} htmlFor={inputId} required={required} hint={hint} error={error}>
				{area}
			</Field>
		);
	},
);
Textarea.displayName = "Textarea";

export const Select = forwardRef(
	({ label, error, hint, className, id, required, children, ...props }, ref) => {
		const autoId = useId();
		const inputId = id || autoId;
		const select = (
			<div className="relative">
				<select
					ref={ref}
					id={inputId}
					required={required}
					className={cn(
						base,
						"h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat py-2 pl-3.5 pr-10",
						error && "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10",
						className,
					)}
					style={{
						backgroundImage:
							"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
					}}
					{...props}
				>
					{children}
				</select>
			</div>
		);

		if (!label && !error && !hint) return select;

		return (
			<Field label={label} htmlFor={inputId} required={required} hint={hint} error={error}>
				{select}
			</Field>
		);
	},
);
Select.displayName = "Select";

export const SearchInput = forwardRef(({ className, ...props }, ref) => (
	<div className={cn("relative", className)}>
		<Search
			size={16}
			className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
		/>
		<input
			ref={ref}
			type="search"
			className={cn(base, "h-10 py-2 pl-10 pr-3.5 [&::-webkit-search-cancel-button]:hidden")}
			{...props}
		/>
	</div>
));
SearchInput.displayName = "SearchInput";

export default Input;
