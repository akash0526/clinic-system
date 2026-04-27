import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	LayoutDashboard,
	Users,
	Calendar,
	ClipboardList,
	Receipt,
	Package,
	FlaskConical,
	Settings,
	Stethoscope,
	LogOut,
	ChevronRight,
	X,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const NAV = [
	{
		to: "/dashboard",
		icon: LayoutDashboard,
		label: "Dashboard",
		labelNe: "ड्यासबोर्ड",
		roles: ["ADMIN", "DOCTOR", "RECEPTIONIST", "LAB_TECH"],
	},
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
	{
		to: "/lab",
		icon: FlaskConical,
		label: "Laboratory",
		labelNe: "प्रयोगशाला",
		roles: ["ADMIN", "LAB_TECH", "DOCTOR"],
	},
	{
		to: "/settings",
		icon: Settings,
		label: "Settings",
		labelNe: "सेटिङ",
		roles: ["ADMIN"],
	},
];

const Sidebar = ({ open, onClose }) => {
	const { t } = useTranslation();
	const { user, logout } = useAuthStore();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate("/login");
		toast.success("Logged out successfully");
	};

	const filtered = NAV.filter((n) => n.roles.includes(user?.role));

	return (
		<aside
			className={`
      fixed lg:static inset-y-0 left-0 z-30
      w-64 bg-gray-900 text-white flex flex-col
      transform transition-transform duration-200 ease-in-out
      ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    `}
		>
			{/* Logo */}
			<div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
						<Stethoscope size={18} className="text-white" />
					</div>
					<div>
						<p className="text-sm font-semibold leading-tight">Clinic MS</p>
						<p className="text-xs text-gray-400 font-nepali">क्लिनिक प्रणाली</p>
					</div>
				</div>
				<button
					onClick={onClose}
					className="lg:hidden text-gray-400 hover:text-white"
				>
					<X size={18} />
				</button>
			</div>

			{/* Nav */}
			<nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
				{filtered.map(({ to, icon: Icon, label, labelNe }) => (
					<NavLink
						key={to}
						to={to}
						onClick={() => window.innerWidth < 1024 && onClose()}
						className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors group
              ${
								isActive
									? "bg-primary-600 text-white"
									: "text-gray-400 hover:bg-gray-800 hover:text-white"
							}
            `}
					>
						<Icon size={18} />
						<span className="flex-1">{label}</span>
						<ChevronRight
							size={14}
							className="opacity-0 group-hover:opacity-100 transition-opacity"
						/>
					</NavLink>
				))}
			</nav>

			{/* User info + logout */}
			<div className="border-t border-gray-800 p-4">
				<div className="flex items-center gap-3 mb-3">
					<div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
						{user?.fullName?.[0]?.toUpperCase()}
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium truncate">{user?.fullName}</p>
						<p className="text-xs text-gray-400">{user?.role}</p>
					</div>
				</div>
				<button
					onClick={handleLogout}
					className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
				>
					<LogOut size={16} />
					Sign Out
				</button>
			</div>
		</aside>
	);
};

export default Sidebar;
