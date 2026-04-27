import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
	timeout: 15000,
	headers: { "Content-Type": "application/json" },
});

// Attach stored token to every request
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("clinic_token");
		if (token) config.headers.Authorization = `Bearer ${token}`;
		return config;
	},
	(error) => Promise.reject(error),
);

// Handle global errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		const status = error.response?.status;
		const message =
			error.response?.data?.message || "Network error. Please try again.";

		if (status === 401) {
			localStorage.removeItem("clinic_token");
			// Only redirect if not already on login page
			if (!window.location.pathname.includes("/login")) {
				window.location.href = "/login";
			}
			return Promise.reject(error);
		}

		// Don't toast validation errors (handled in forms)
		if (status !== 422 && status !== 404) {
			toast.error(message);
		}

		return Promise.reject(error);
	},
);

export default api;
