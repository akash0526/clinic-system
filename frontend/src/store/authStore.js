import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

const useAuthStore = create(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			isAuthenticated: false,

			login: async (email, password) => {
				const res = await api.post("/auth/login", { email, password });
				const { user, token } = res.data.data;
				localStorage.setItem("clinic_token", token);
				set({ user, token, isAuthenticated: true });
				return user;
			},

			logout: async () => {
				try {
					if (get().isAuthenticated) await api.post("/auth/logout");
				} catch {
					/* ignore */
				}
				localStorage.removeItem("clinic_token");
				set({ user: null, token: null, isAuthenticated: false });
			},

			setUser: (user) => set({ user }),
		}),
		{
			name: "clinic_auth",
			partialize: (s) => ({
				user: s.user,
				token: s.token,
				isAuthenticated: s.isAuthenticated,
			}),
		},
	),
);

export default useAuthStore;
