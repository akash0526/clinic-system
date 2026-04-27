import api from "./axios";

export const patientsApi = {
	list: (params) => api.get("/patients", { params }),
	get: (id) => api.get(`/patients/${id}`),
	create: (data) => api.post("/patients", data),
	update: (id, data) => api.put(`/patients/${id}`, data),
	delete: (id) => api.delete(`/patients/${id}`),
};
