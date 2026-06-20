import api from "./axios";

export const billingApi = {
	list: (params) => api.get("/billing", { params }),
	get: (id) => api.get(`/billing/${id}`),
	create: (data) => api.post("/billing", data),
	addPayment: (id, data) => api.post(`/billing/${id}/payment`, data),
};
