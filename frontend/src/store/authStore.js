import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

const useAuthStore = create(
	persist(
		(set, get) => ({
			user: null,
			isAuthenticated: false,

			login: async (email, password) => {
				const res = await api.post("/auth/login", { email, password });
				const { user } = res.data.data;
				// No token handling here — the server sets a secure httpOnly cookie.
				set({ user, isAuthenticated: true });
				return user;
			},

			logout: async () => {
				try {
					if (get().isAuthenticated) await api.post("/auth/logout");
				} catch {
					/* ignore */
				}
				// Server clears the cookie; we just clear local user state.
				set({ user: null, isAuthenticated: false });
			},

			setUser: (user) => set({ user }),
		}),
		{
			name: "clinic_auth",
			// Only persist user + auth flag (NOT a token — there is none on the client).
			partialize: (s) => ({
				user: s.user,
				isAuthenticated: s.isAuthenticated,
			}),
		},
	),
);

export default useAuthStore;
