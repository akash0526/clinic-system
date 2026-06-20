import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
	timeout: 15000,
	headers: { "Content-Type": "application/json" },
	// Send & receive the httpOnly auth cookie on every request.
	withCredentials: true,
});

// Handle global errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		const status = error.response?.status;
		const message =
			error.response?.data?.message || "Network error. Please try again.";

		if (status === 401) {
			// Session expired / not authenticated — bounce to login.
			// (No token to remove anymore — the cookie is cleared by the server
			//  on logout, or simply expires.)
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
