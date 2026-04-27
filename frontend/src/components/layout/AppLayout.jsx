import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useState } from "react";

const AppLayout = () => {
	const [sidebarOpen, setSidebarOpen] = useState(true);

	return (
		<div className="flex h-screen bg-gray-50 overflow-hidden">
			{/* Sidebar */}
			<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			{/* Mobile overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black/40 z-20 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				<TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />
				<main className="flex-1 overflow-y-auto scrollbar-thin">
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default AppLayout;
