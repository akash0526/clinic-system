import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
	Users,
	Calendar,
	Receipt,
	FlaskConical,
	Clock,
	AlertTriangle,
	Plus,
	ArrowUpRight,
	CalendarPlus,
	UserPlus,
	ChevronRight,
	CheckCircle2,
} from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import { Card, CardHeader } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../utils/cn";

const StatCard = ({ icon: Icon, label, value, sub, tone, loading }) => (
	<Card hover className="p-5">
		<div className="flex items-start justify-between gap-3">
			<div className="min-w-0">
				<p className="text-[12.5px] font-medium text-slate-500">{label}</p>
				{loading ? (
					<Skeleton className="mt-2.5 h-8 w-24" />
				) : (
					<p className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight text-slate-900">
						{value ?? "—"}
					</p>
				)}
				{sub && !loading && <p className="mt-2 text-[11.5px] text-slate-400">{sub}</p>}
			</div>
			<span
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
					tone,
				)}
			>
				<Icon size={19} strokeWidth={2.1} />
			</span>
		</div>
	</Card>
);

const QuickAction = ({ to, icon: Icon, label, hint }) => (
	<Link
		to={to}
		className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-white"
	>
		<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-brand-50 group-hover:text-brand-600">
			<Icon size={17} />
		</span>
		<span className="min-w-0 flex-1">
			<span className="block text-[13px] font-medium text-slate-800">{label}</span>
			<span className="block truncate text-[11.5px] text-slate-400">{hint}</span>
		</span>
		<ChevronRight
			size={15}
			className="mt-2 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
		/>
	</Link>
);

const Dashboard = () => {
	const { user } = useAuthStore();

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: () => api.get("/dashboard/stats").then((r) => r.data.data),
		refetchInterval: 60000,
	});

	const { data: todayAppts, isLoading: apptLoading } = useQuery({
		queryKey: ["today-appointments"],
		queryFn: () =>
			api
				.get("/appointments", { params: { today: true, limit: 10 } })
				.then((r) => r.data.data),
	});

	const firstName = user?.fullName?.split(" ")[0] || "there";
	const can = (roles) => roles.includes(user?.role);

	const quickActions = [
		{
			to: "/patients/new",
			icon: UserPlus,
			label: "Register patient",
			hint: "Add a new patient record",
			roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
		},
		{
			to: "/appointments",
			icon: CalendarPlus,
			label: "Book appointment",
			hint: "Schedule a visit with a doctor",
			roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
		},
		{
			to: "/billing",
			icon: Receipt,
			label: "Create bill",
			hint: "Collect payment and print receipt",
			roles: ["ADMIN", "RECEPTIONIST"],
		},
		{
			to: "/lab",
			icon: FlaskConical,
			label: "Lab results",
			hint: "Record or review test results",
			roles: ["ADMIN", "DOCTOR", "LAB_TECH"],
		},
	].filter((a) => can(a.roles));
	const today = new Date().toLocaleDateString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	return (
		<div className="page">
			<PageHeader
				eyebrow={today}
				title={`Good ${getGreeting()}, ${firstName}`}
				description="Here's a quick look at your clinic today."
				actions={
					<>
						{can(["ADMIN", "DOCTOR", "RECEPTIONIST"]) && (
							<Button
								as={Link}
								to="/appointments"
								variant="secondary"
								icon={CalendarPlus}
							>
								New appointment
							</Button>
						)}
						{can(["ADMIN", "DOCTOR", "RECEPTIONIST"]) && (
							<Button as={Link} to="/patients/new" icon={Plus}>
								Add patient
							</Button>
						)}
					</>
				}
			/>

			{/* Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					icon={Users}
					label="Total patients"
					value={stats?.totalPatients?.toLocaleString?.() ?? stats?.totalPatients}
					sub="Registered in the system"
					tone="bg-sky-50 text-sky-600 ring-sky-100"
					loading={statsLoading}
				/>
				<StatCard
					icon={Calendar}
					label="Today's appointments"
					value={stats?.todayAppointments}
					sub="Scheduled for today"
					tone="bg-brand-50 text-brand-600 ring-brand-100"
					loading={statsLoading}
				/>
				<StatCard
					icon={Receipt}
					label="Today's revenue"
					value={`NPR ${Number(stats?.todayRevenue ?? 0).toLocaleString()}`}
					sub="Collected so far"
					tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
					loading={statsLoading}
				/>
				<StatCard
					icon={FlaskConical}
					label="Pending lab results"
					value={stats?.pendingLabs}
					sub="Awaiting reports"
					tone="bg-amber-50 text-amber-600 ring-amber-100"
					loading={statsLoading}
				/>
			</div>

			<div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
				{/* Appointments */}
				<Card className="lg:col-span-2">
					<CardHeader
						icon={Clock}
						title="Today's appointments"
						subtitle={today}
						action={
							<Link
								to="/appointments"
								className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
							>
								View all <ArrowUpRight size={13} />
							</Link>
						}
					/>

					<div className="divide-y divide-slate-100">
						{apptLoading &&
							Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="flex items-center gap-3 px-5 py-3.5">
									<Skeleton className="h-9 w-9 rounded-full" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-3 w-40" />
										<Skeleton className="h-3 w-28" />
									</div>
									<Skeleton className="h-5 w-16 rounded-full" />
								</div>
							))}

						{!apptLoading && !todayAppts?.length && (
							<EmptyState
								icon={Calendar}
								title="No appointments today"
								description="Once appointments are booked they'll show up here in queue order."
								className="py-10"
								action={
									<Button as={Link} to="/appointments" size="sm" variant="soft" icon={Plus}>
										Book appointment
									</Button>
								}
							/>
						)}

						{!apptLoading &&
							todayAppts?.slice(0, 8).map((a) => (
								<div
									key={a.id}
									className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/70"
								>
									<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
										{a.tokenNumber ? `#${a.tokenNumber}` : "—"}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-[13.5px] font-medium text-slate-900">
											{a.patient?.fullName}
										</p>
										<p className="truncate text-[11.5px] text-slate-400">
											{a.appointmentTime}
											{a.doctor?.fullName ? ` · Dr. ${a.doctor.fullName}` : ""}
											{a.type ? ` · ${a.type}` : ""}
										</p>
									</div>
									<StatusBadge status={a.status} />
								</div>
							))}
					</div>
				</Card>

				{/* Right column */}
				<div className="space-y-5">
					<Card>
						<CardHeader icon={ArrowUpRight} title="Quick actions" />
						<div className="p-2">
							{quickActions.map((action) => (
								<QuickAction key={action.to} {...action} />
							))}
						</div>
					</Card>

					<Card>
						<CardHeader icon={AlertTriangle} title="Low stock alerts" />
						<LowStockList />
					</Card>
				</div>
			</div>
		</div>
	);
};

const LowStockList = () => {
	const { data, isLoading } = useQuery({
		queryKey: ["low-stock"],
		queryFn: () => api.get("/inventory/low-stock").then((r) => r.data.data),
	});

	if (isLoading)
		return (
			<div className="space-y-3 p-5">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-4 w-full" />
				))}
			</div>
		);

	if (!data?.length)
		return (
			<div className="flex flex-col items-center justify-center px-5 py-9 text-center">
				<span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
					<CheckCircle2 size={19} />
				</span>
				<p className="text-[13px] font-medium text-slate-700">All stock is healthy</p>
				<p className="mt-0.5 text-[11.5px] text-slate-400">
					Nothing is below its minimum level.
				</p>
			</div>
		);

	return (
		<div className="divide-y divide-slate-100">
			{data.slice(0, 5).map((item) => (
				<div key={item.id} className="flex items-center gap-3 px-5 py-3">
					<div className="min-w-0 flex-1">
						<p className="truncate text-[13px] font-medium text-slate-800">{item.name}</p>
						<p className="truncate text-[11.5px] text-slate-400">
							{item.category?.replaceAll("_", " ").toLowerCase()}
						</p>
					</div>
					<div className="text-right">
						<p className="text-[13px] font-semibold text-rose-600">{item.currentStock}</p>
						<p className="text-[10.5px] text-slate-400">min {item.minimumStock}</p>
					</div>
				</div>
			))}
		</div>
	);
};

const getGreeting = () => {
	const h = new Date().getHours();
	if (h < 12) return "morning";
	if (h < 17) return "afternoon";
	return "evening";
};

export default Dashboard;
