import { Menu, Bell, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/authStore";
import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
	"/dashboard": { en: "Dashboard", ne: "ड्यासबोर्ड" },
	"/patients": { en: "Patients", ne: "बिरामीहरू" },
	"/appointments": { en: "Appointments", ne: "अपोइन्टमेन्ट" },
	"/encounters": { en: "Encounters", ne: "भेटघाट" },
	"/billing": { en: "Billing", ne: "बिलिङ" },
	"/inventory": { en: "Inventory", ne: "भण्डार" },
	"/lab": { en: "Laboratory", ne: "प्रयोगशाला" },
	"/settings": { en: "Settings", ne: "सेटिङ" },
};

const TopBar = ({ onMenuClick }) => {
	const { i18n } = useTranslation();
	const { user } = useAuthStore();
	const location = useLocation();

	const toggleLang = () => {
		const next = i18n.language === "en" ? "ne" : "en";
		i18n.changeLanguage(next);
		localStorage.setItem("lang", next);
	};

	const basePath = "/" + location.pathname.split("/")[1];
	const title = PAGE_TITLES[basePath];

	return (
		<header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
			<div className="flex items-center gap-3">
				<button
					onClick={onMenuClick}
					className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
				>
					<Menu size={20} />
				</button>
				{title && (
					<div>
						<h2 className="text-sm font-semibold text-gray-800">{title.en}</h2>
						<p className="text-xs text-gray-400 font-nepali leading-none">
							{title.ne}
						</p>
					</div>
				)}
			</div>

			<div className="flex items-center gap-2">
				{/* Language toggle */}
				<button
					onClick={toggleLang}
					className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
				>
					<Globe size={13} />
					{i18n.language === "en" ? "नेपाली" : "English"}
				</button>

				{/* Notification bell */}
				<button className="relative p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
					<Bell size={18} />
				</button>

				{/* Avatar */}
				<div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
					{user?.fullName?.[0]?.toUpperCase()}
				</div>
			</div>
		</header>
	);
};

export default TopBar;
