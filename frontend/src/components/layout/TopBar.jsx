import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	Menu,
	PanelLeftClose,
	PanelLeftOpen,
	Globe,
	Bell,
	ChevronDown,
	LogOut,
	UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import Avatar from "../ui/Avatar";
import { cn } from "../../utils/cn";

const PAGE_TITLES = {
	"/dashboard": { en: "Dashboard", ne: "ड्यासबोर्ड" },
	"/patients": { en: "Patients", ne: "बिरामीहरू" },
	"/appointments": { en: "Appointments", ne: "अपोइन्टमेन्ट" },
	"/encounters": { en: "Encounters", ne: "भेटघाट" },
	"/billing": { en: "Billing", ne: "बिलिङ" },
	"/inventory": { en: "Inventory", ne: "भण्डार" },
	"/lab": { en: "Laboratory", ne: "प्रयोगशाला" },
	"/users": { en: "Users", ne: "प्रयोगकर्ता" },
	"/settings": { en: "Settings", ne: "सेटिङ" },
};

const TopBar = ({ onMenuClick, collapsed, onToggleCollapse }) => {
	const { i18n } = useTranslation();
	const { user, logout } = useAuthStore();
	const location = useLocation();
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef(null);

	useEffect(() => {
		const onClick = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, []);

	useEffect(() => setMenuOpen(false), [location.pathname]);

	const toggleLang = () => {
		const next = i18n.language === "en" ? "ne" : "en";
		i18n.changeLanguage(next);
		localStorage.setItem("lang", next);
	};

	const handleLogout = async () => {
		await logout();
		toast.success("Signed out");
		navigate("/login", { replace: true });
	};

	const basePath = "/" + location.pathname.split("/")[1];
	const title = PAGE_TITLES[basePath];
	const isNe = i18n.language === "ne";

	return (
		<header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
			<div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
				{/* Sidebar toggles */}
				<button
					onClick={onMenuClick}
					className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
					aria-label="Open menu"
				>
					<Menu size={20} />
				</button>
				<button
					onClick={onToggleCollapse}
					className="hidden rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:inline-flex"
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
				</button>

				<div className="min-w-0">
					<p className="hidden text-[11px] font-medium text-slate-400 sm:block">Clinic MS</p>
					<h2 className="truncate text-[15px] font-semibold leading-tight text-slate-900">
						{title ? (isNe ? title.ne : title.en) : "Overview"}
					</h2>
				</div>

				<div className="ml-auto flex items-center gap-1.5 sm:gap-2">
					{/* Language */}
					<button
						onClick={toggleLang}
						className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
						aria-label="Switch language"
					>
						<Globe size={14} className="text-slate-400" />
						<span className="hidden sm:inline">{isNe ? "English" : "नेपाली"}</span>
						<span className="sm:hidden">{isNe ? "EN" : "NE"}</span>
					</button>

					{/* Notifications */}
					<button
						className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
						aria-label="Notifications"
					>
						<Bell size={18} />
						<span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
					</button>

					<span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

					{/* User menu */}
					<div className="relative" ref={menuRef}>
						<button
							onClick={() => setMenuOpen((v) => !v)}
							className="flex items-center gap-2 rounded-xl p-1 pr-1 transition hover:bg-slate-100 sm:pr-2"
							aria-haspopup="menu"
							aria-expanded={menuOpen}
						>
							<Avatar name={user?.fullName} size="sm" />
							<span className="hidden min-w-0 text-left sm:block">
								<span className="block max-w-[140px] truncate text-[13px] font-medium leading-tight text-slate-800">
									{user?.fullName}
								</span>
								<span className="block text-[11px] capitalize leading-tight text-slate-400">
									{user?.role?.replaceAll("_", " ").toLowerCase()}
								</span>
							</span>
							<ChevronDown
								size={15}
								className={cn(
									"hidden text-slate-400 transition-transform sm:block",
									menuOpen && "rotate-180",
								)}
							/>
						</button>

						{menuOpen && (
							<div
								role="menu"
								className="absolute right-0 mt-2 w-60 animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift"
							>
								<div className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
									<Avatar name={user?.fullName} size="md" />
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-slate-900">
											{user?.fullName}
										</p>
										<p className="truncate text-xs text-slate-500">{user?.email}</p>
									</div>
								</div>
								<div className="my-1 h-px bg-slate-100" />
								<button
									role="menuitem"
									onClick={() => navigate("/settings")}
									className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
								>
									<UserRound size={15} className="text-slate-400" />
									Account settings
								</button>
								<button
									role="menuitem"
									onClick={handleLogout}
									className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-rose-600 transition hover:bg-rose-50"
								>
									<LogOut size={15} />
									Sign out
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default TopBar;
