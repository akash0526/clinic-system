import api from "./axios";

export const billingApi = {
	list: (params) => api.get("/billing", { params }),
	get: (id) => api.get(`/billing/${id}`),
	create: (data) => api.post("/billing", data),
	addPayment: (id, data) => api.post(`/billing/${id}/payment`, data),
	// Search inventory items (medicines/consumables) for bill lines.
	searchInventory: (search) =>
		api.get("/inventory", { params: { search, limit: 8 } }),
	// Lab tests are a separate catalogue (different table).
	searchLabTests: () => api.get("/lab/tests"),
};
