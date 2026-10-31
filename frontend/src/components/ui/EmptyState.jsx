import { Inbox } from "lucide-react";
import { cn } from "../../utils/cn";

const EmptyState = ({ icon: Icon = Inbox, title, description, action, className }) => (
	<div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
		<span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200/70">
			<Icon size={22} />
		</span>
		<p className="text-sm font-semibold text-slate-800">{title}</p>
		{description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>}
		{action && <div className="mt-4">{action}</div>}
	</div>
);

export default EmptyState;
