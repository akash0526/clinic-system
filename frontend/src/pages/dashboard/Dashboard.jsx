import { useQuery } from "@tanstack/react-query";
import {
	Users,
	Calendar,
	Receipt,
	FlaskConical,
	TrendingUp,
	Clock,
	AlertTriangle,
} from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
	<div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
		<div
			className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
		>
			<Icon size={22} className="text-white" />
		</div>
		<div>
			<p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
			<p className="text-sm text-gray-500">{label}</p>
			{sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
		</div>
	</div>
);

const Dashboard = () => {
	const { user } = useAuthStore();

	const { data: stats } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: () => api.get("/dashboard/stats").then((r) => r.data.data),
		refetchInterval: 60000,
	});

	const { data: todayAppts } = useQuery({
		queryKey: ["today-appointments"],
		queryFn: () =>
			api
				.get("/appointments", {
					params: { today: true, limit: 10 },
				})
				.then((r) => r.data.data),
	});

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Greeting */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">
					Good {getGreeting()}, {user?.fullName?.split(" ")[0]} 👋
				</h1>
				<p className="text-gray-500 text-sm mt-1">
					Here's what's happening today
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					icon={Users}
					label="Total Patients"
					value={stats?.totalPatients}
					color="bg-blue-500"
					sub="Registered"
				/>
				<StatCard
					icon={Calendar}
					label="Today's Appointments"
					value={stats?.todayAppointments}
					color="bg-green-500"
					sub="Scheduled"
				/>
				<StatCard
					icon={Receipt}
					label="Today's Revenue"
					value={`NPR ${stats?.todayRevenue ?? 0}`}
					color="bg-purple-500"
					sub="Collected"
				/>
				<StatCard
					icon={FlaskConical}
					label="Pending Lab Results"
					value={stats?.pendingLabs}
					color="bg-orange-500"
					sub="Awaiting"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Today's appointments */}
				<div className="bg-white rounded-xl border border-gray-200">
					<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
						<h3 className="font-semibold text-gray-800 flex items-center gap-2">
							<Clock size={16} className="text-primary-500" /> Today's
							Appointments
						</h3>
						<span className="text-xs text-gray-400">
							{new Date().toLocaleDateString("en-NP")}
						</span>
					</div>
					<div className="divide-y divide-gray-50">
						{!todayAppts?.length ? (
							<p className="px-5 py-8 text-center text-gray-400 text-sm">
								No appointments today
							</p>
						) : (
							todayAppts.slice(0, 8).map((a) => (
								<div key={a.id} className="flex items-center gap-3 px-5 py-3">
									<div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
										{a.tokenNumber || "#"}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-800 truncate">
											{a.patient?.fullName}
										</p>
										<p className="text-xs text-gray-400">
											{a.appointmentTime} · Dr. {a.doctor?.fullName}
										</p>
									</div>
									<StatusPill status={a.status} />
								</div>
							))
						)}
					</div>
				</div>

				{/* Low stock alert */}
				<div className="bg-white rounded-xl border border-gray-200">
					<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
						<h3 className="font-semibold text-gray-800 flex items-center gap-2">
							<AlertTriangle size={16} className="text-amber-500" /> Low Stock
							Alerts
						</h3>
					</div>
					<LowStockList />
				</div>
			</div>
		</div>
	);
};

const StatusPill = ({ status }) => {
	const map = {
		SCHEDULED: "bg-blue-100 text-blue-700",
		CONFIRMED: "bg-green-100 text-green-700",
		IN_PROGRESS: "bg-yellow-100 text-yellow-700",
		COMPLETED: "bg-gray-100 text-gray-600",
		CANCELLED: "bg-red-100 text-red-600",
		NO_SHOW: "bg-orange-100 text-orange-600",
	};
	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}
		>
			{status}
		</span>
	);
};

const LowStockList = () => {
	const { data } = useQuery({
		queryKey: ["low-stock"],
		queryFn: () => api.get("/inventory/low-stock").then((r) => r.data.data),
	});

	if (!data?.length)
		return (
			<p className="px-5 py-8 text-center text-gray-400 text-sm">
				All stocks are adequate ✓
			</p>
		);

	return (
		<div className="divide-y divide-gray-50">
			{data.slice(0, 8).map((item) => (
				<div
					key={item.id}
					className="flex items-center justify-between px-5 py-3"
				>
					<div>
						<p className="text-sm font-medium text-gray-800">{item.name}</p>
						<p className="text-xs text-gray-400">{item.category}</p>
					</div>
					<div className="text-right">
						<p className="text-sm font-bold text-red-600">
							{item.currentStock}
						</p>
						<p className="text-xs text-gray-400">min: {item.minimumStock}</p>
					</div>
				</div>
			))}
		</div>
	);
};

const getGreeting = () => {
	const h = new Date().getHours();
	if (h < 12) return "Morning";
	if (h < 17) return "Afternoon";
	return "Evening";
};

export default Dashboard;
