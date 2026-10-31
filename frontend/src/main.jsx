import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import "./i18n/index.js";
import "./index.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		},
	},
});

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			<Toaster
				position="top-right"
				gutter={10}
				containerStyle={{ top: 76, right: 20 }}
				toastOptions={{
					duration: 3000,
					style: {
						fontSize: "13.5px",
						fontWeight: 500,
						color: "#0f172a",
						background: "#ffffff",
						border: "1px solid #e2e8f0",
						borderRadius: "12px",
						padding: "10px 14px",
						boxShadow: "0 12px 32px -20px rgba(15, 23, 42, 0.35)",
					},
					success: { iconTheme: { primary: "#0d9488", secondary: "#ffffff" } },
					error: { iconTheme: { primary: "#e11d48", secondary: "#ffffff" } },
				}}
			/>
		</QueryClientProvider>
	</React.StrictMode>,
);
