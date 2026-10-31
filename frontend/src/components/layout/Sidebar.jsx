import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	LayoutDashboard,
	Users,
	UserCog,
	Calendar,
	ClipboardList,
	Receipt,
	Package,
	FlaskConical,
	Settings,
	Stethoscope,
	LogOut,
	X,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";
import Avatar from "../ui/Avatar";

const NAV_GROUPS = [
	{
		label: "Overview",
		items: [
			{
				to: "/dashboard",
				icon: LayoutDashboard,
				label: "Dashboard",
				labelNe: "ड्यासबोर्ड",
				roles: ["ADMIN", "DOCTOR", "RECEPTIONIST", "LAB_TECH"],
			},
		],
	},
	{
		label: "Care",
		items: [
			{
				to: "/patients",
				icon: Users,
				label: "Patients",
				labelNe: "बिरामीहरू",
				roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
			},
			{
				to: "/appointments",
				icon: Calendar,
				label: "Appointments",
				labelNe: "अपोइन्टमेन्ट",
				roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
			},
			{
				to: "/encounters",
				icon: ClipboardList,
				label: "Encounters",
				labelNe: "भेटघाट",
				roles: ["ADMIN", "DOCTOR"],
			},
			{
				to: "/lab",
				icon: FlaskConical,
				label: "Laboratory",
				labelNe: "प्रयोगशाला",
				roles: ["ADMIN", "LAB_TECH", "DOCTOR"],
			},
		],
	},
	{
		label: "Operations",
		items: [
			{
				to: "/billing",
				icon: Receipt,
				label: "Billing",
				labelNe: "बिलिङ",
				roles: ["ADMIN", "RECEPTIONIST"],
			},
			{
				to: "/inventory",
				icon: Package,
				label: "Inventory",
				labelNe: "भण्डार",
				roles: ["ADMIN", "RECEPTIONIST"],
			},
		],
	},
	{
		label: "Admin",
		items: [
			{
				to: "/users",
				icon: UserCog,
				label: "Users",
				labelNe: "प्रयोगकर्ता",
				roles: ["ADMIN"],
			},
			{
				to: "/settings",
				icon: Settings,
				label: "Settings",
				labelNe: "सेटिङ",
				roles: ["ADMIN"],
			},
		],
	},
];

const Sidebar = ({ open, collapsed, onClose }) => {
	const { i18n } = useTranslation();
	const { user, logout } = useAuthStore();
	const navigate = useNavigate();
	const isNe = i18n.language === "ne";

	const handleLogout = async () => {
		await logout();
		toast.success("Signed out");
		navigate("/login", { replace: true });
	};

	const groups = NAV_GROUPS.map((g) => ({
		...g,
		items: g.items.filter((item) => item.roles.includes(user?.role)),
	})).filter((g) => g.items.length > 0);

	return (
		<aside
			className={cn(
				"fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-slate-200/80 bg-white",
				"transition-[transform,width] duration-300 ease-smooth",
				collapsed ? "lg:w-[84px]" : "lg:w-[272px]",
				open ? "translate-x-0 shadow-lift lg:shadow-none" : "-translate-x-full lg:translate-x-0",
			)}
		>
			{/* Brand */}
			<div
				className={cn(
					"flex h-16 shrink-0 items-center gap-3 border-b border-slate-100",
					collapsed ? "lg:justify-center lg:px-0" : "px-5",
					"px-5",
				)}
			>
				<NavLink to="/dashboard" className="flex min-w-0 items-center gap-3">
					<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/20">
						<Stethoscope size={18} strokeWidth={2.2} />
					</span>
					<span className={cn("min-w-0", collapsed && "lg:hidden")}>
						<span className="block truncate text-[15px] font-semibold leading-tight text-slate-900">
							Clinic MS
						</span>
						<span className="block truncate text-[11px] leading-tight text-slate-400 font-nepali">
							क्लिनिक प्रणाली
						</span>
					</span>
				</NavLink>

				<button
					onClick={onClose}
					className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
					aria-label="Close menu"
				>
					<X size={18} />
				</button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin">
				{groups.map((group, gi) => (
					<div key={group.label} className={cn(gi > 0 && "mt-5")}>
						<p
							className={cn(
								"mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400",
								collapsed && "lg:text-center lg:px-0",
							)}
						>
							<span className={cn(collapsed && "lg:hidden")}>{group.label}</span>
							<span className={cn("hidden", collapsed && "lg:block")}>•••</span>
						</p>
						<div className="space-y-1">
							{group.items.map(({ to, icon: Icon, label, labelNe }) => (
								<NavLink
									key={to}
									to={to}
									title={collapsed ? label : undefined}
									onClick={() => window.innerWidth < 1024 && onClose()}
									className={({ isActive }) =>
										cn(
											"group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition duration-150",
											collapsed && "lg:justify-center lg:px-0",
											isActive
												? "bg-brand-50 text-brand-700"
												: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
										)
									}
								>
									{({ isActive }) => (
										<>
											<span
												className={cn(
													"absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600 transition-opacity",
													isActive ? "opacity-100" : "opacity-0",
												)}
											/>
											<Icon
												size={18}
												strokeWidth={isActive ? 2.3 : 1.9}
												className={cn(
													"shrink-0 transition-colors",
													isActive
														? "text-brand-600"
														: "text-slate-400 group-hover:text-slate-600",
												)}
											/>
											<span className={cn("truncate", collapsed && "lg:hidden")}>
												{isNe ? labelNe : label}
											</span>
										</>
									)}
								</NavLink>
							))}
						</div>
					</div>
				))}
			</nav>

			{/* Footer */}
			<div className="shrink-0 border-t border-slate-100 p-3">
				<div
					className={cn(
						"flex items-center gap-3 rounded-xl px-2 py-2",
						collapsed && "lg:justify-center lg:px-0",
					)}
				>
					<Avatar name={user?.fullName} size="sm" />
					<div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
						<p className="truncate text-[13px] font-medium text-slate-900">
							{user?.fullName}
						</p>
						<p className="truncate text-[11px] capitalize text-slate-400">
							{user?.role?.replaceAll("_", " ").toLowerCase()}
						</p>
					</div>
					<button
						onClick={handleLogout}
						className={cn(
							"rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600",
							collapsed && "lg:hidden",
						)}
						title="Sign out"
						aria-label="Sign out"
					>
						<LogOut size={16} />
					</button>
				</div>

			</div>
		</aside>
	);
};

export default Sidebar;
