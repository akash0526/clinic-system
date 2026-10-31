import { cn } from "../../utils/cn";

export const Skeleton = ({ className }) => (
	<div className={cn("skeleton", className)} aria-hidden="true" />
);

export const SkeletonText = ({ lines = 3, className }) => (
	<div className={cn("space-y-2", className)}>
		{Array.from({ length: lines }).map((_, i) => (
			<Skeleton
				key={i}
				className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
			/>
		))}
	</div>
);

export const SkeletonRows = ({ rows = 5, cols = 4 }) => (
	<>
		{Array.from({ length: rows }).map((_, r) => (
			<tr key={r} className="border-b border-slate-100 last:border-0">
				{Array.from({ length: cols }).map((_, c) => (
					<td key={c} className="px-4 py-4 first:pl-5 last:pr-5">
						<Skeleton className={cn("h-3.5", c === 1 ? "w-40" : "w-20")} />
					</td>
				))}
			</tr>
		))}
	</>
);

export default Skeleton;
