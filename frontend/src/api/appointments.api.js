import api from "./axios";

export const appointmentsApi = {
	list: (params) => api.get("/appointments", { params }),
	get: (id) => api.get(`/appointments/${id}`),
	create: (data) => api.post("/appointments", data),
	updateStatus: (id, status) =>
		api.patch(`/appointments/${id}/status`, { status }),
	getDoctors: () => api.get("/appointments/doctors"),
};
