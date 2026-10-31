import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "../../utils/cn";

const AppLayout = () => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(
		() => localStorage.getItem("sidebar:collapsed") === "1",
	);
	const { pathname } = useLocation();

	const toggleCollapsed = () => {
		setCollapsed((v) => {
			localStorage.setItem("sidebar:collapsed", v ? "0" : "1");
			return !v;
		});
	};

	// Close the mobile drawer and reset scroll whenever the route changes.
	useEffect(() => {
		setMobileOpen(false);
		window.scrollTo({ top: 0, left: 0, behavior: "auto" });
	}, [pathname]);

	return (
		<div className="min-h-screen bg-slate-50">
			<Sidebar
				open={mobileOpen}
				collapsed={collapsed}
				onClose={() => setMobileOpen(false)}
			/>

			{/* Mobile backdrop */}
			<div
				className={cn(
					"fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
					mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
				)}
				onClick={() => setMobileOpen(false)}
				aria-hidden="true"
			/>

			<div
				className={cn(
					"flex min-h-screen flex-col transition-[padding] duration-300 ease-smooth",
					collapsed ? "lg:pl-[84px]" : "lg:pl-[272px]",
				)}
			>
				<TopBar
					onMenuClick={() => setMobileOpen((v) => !v)}
					collapsed={collapsed}
					onToggleCollapse={toggleCollapsed}
				/>
				<main className="flex-1">
					<div key={pathname} className="animate-fade-in-up">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
};

export default AppLayout;
