import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Power, Phone } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

const usersApi = {
	list: () => api.get("/users"),
	create: (data) => api.post("/users", data),
	update: (id, data) => api.put(`/users/${id}`, data),
	toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
};

const ROLE_COLORS = {
	ADMIN: "bg-red-100 text-red-700",
	DOCTOR: "bg-blue-100 text-blue-700",
	RECEPTIONIST: "bg-green-100 text-green-700",
	LAB_TECH: "bg-purple-100 text-purple-700",
};

const RoleBadge = ({ role }) => (
	<span
		className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role]}`}
	>
		{role.replace("_", " ")}
	</span>
);

const UserFormModal = ({ user, onClose }) => {
	const queryClient = useQueryClient();
	const isEditing = !!user;
	const [form, setForm] = useState({
		email: user?.email || "",
		fullName: user?.fullName || "",
		fullNameNe: user?.fullNameNe || "",
		role: user?.role || "RECEPTIONIST",
		phone: user?.phone || "",
		licenseNumber: user?.licenseNumber || "",
		specialization: user?.specialization || "",
		password: "",
	});

	const createMutation = useMutation({
		mutationFn: (data) => usersApi.create(data),
		onSuccess: () => {
			toast.success("User created");
			queryClient.invalidateQueries(["users"]);
			onClose();
		},
	});

	const updateMutation = useMutation({
		mutationFn: (data) => usersApi.update(user.id, data),
		onSuccess: () => {
			toast.success("User updated");
			queryClient.invalidateQueries(["users"]);
			onClose();
		},
	});

	const handleChange = (e) =>
		setForm({ ...form, [e.target.name]: e.target.value });

	const handleSubmit = (e) => {
		e.preventDefault();
		const payload = { ...form };
		if (!payload.password) delete payload.password;
		if (isEditing) {
			updateMutation.mutate(payload);
		} else {
			if (!payload.password) return toast.error("Password is required");
			createMutation.mutate(payload);
		}
	};

	const isLoading = createMutation.isLoading || updateMutation.isLoading;

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
				<div className="flex items-center justify-between p-5 border-b">
					<h2 className="text-lg font-semibold">
						{isEditing ? "Edit User" : "Add New User"}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-xl"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-5 space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Email *
						</label>
						<input
							type="email"
							name="email"
							value={form.email}
							onChange={handleChange}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							{isEditing ? "New Password (leave blank to keep)" : "Password *"}
						</label>
						<input
							type="password"
							name="password"
							value={form.password}
							onChange={handleChange}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							minLength={8}
							{...(!isEditing && { required: true })}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Full Name *
						</label>
						<input
							type="text"
							name="fullName"
							value={form.fullName}
							onChange={handleChange}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Full Name (Nepali)
						</label>
						<input
							type="text"
							name="fullNameNe"
							value={form.fullNameNe}
							onChange={handleChange}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-nepali focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Role *
						</label>
						<select
							name="role"
							value={form.role}
							onChange={handleChange}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
							required
						>
							<option value="ADMIN">Admin</option>
							<option value="DOCTOR">Doctor</option>
							<option value="RECEPTIONIST">Receptionist</option>
							<option value="LAB_TECH">Lab Technician</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Phone
						</label>
						<input
							type="tel"
							name="phone"
							value={form.phone}
							onChange={handleChange}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
					{form.role === "DOCTOR" && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									License Number
								</label>
								<input
									type="text"
									name="licenseNumber"
									value={form.licenseNumber}
									onChange={handleChange}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Specialization
								</label>
								<input
									type="text"
									name="specialization"
									value={form.specialization}
									onChange={handleChange}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
							</div>
						</>
					)}

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
						>
							{isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

const UsersPage = () => {
	const [showForm, setShowForm] = useState(false);
	const [editUser, setEditUser] = useState(null);
	const queryClient = useQueryClient();

	const { data: users, isLoading } = useQuery({
		queryKey: ["users"],
		queryFn: () => usersApi.list().then((r) => r.data.data),
	});

	const toggleActiveMutation = useMutation({
		mutationFn: (id) => usersApi.toggleActive(id),
		onSuccess: () => {
			queryClient.invalidateQueries(["users"]);
			toast.success("Status toggled");
		},
	});

	return (
		<div className="p-6 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-gray-900">User Management</h1>
				<button
					onClick={() => {
						setEditUser(null);
						setShowForm(true);
					}}
					className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
				>
					<Plus size={16} /> Add User
				</button>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-gray-50 border-b">
						<tr>
							<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
								User
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
								Role
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
								Contact
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
								Status
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{isLoading && (
							<tr>
								<td
									colSpan={5}
									className="px-4 py-10 text-center text-gray-400"
								>
									Loading...
								</td>
							</tr>
						)}
						{users?.map((user) => (
							<tr key={user.id} className="hover:bg-gray-50">
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
											{user.fullName?.charAt(0)?.toUpperCase()}
										</div>
										<div>
											<p className="font-medium text-gray-900">
												{user.fullName}
											</p>
											{user.fullNameNe && (
												<p className="text-xs text-gray-400 font-nepali">
													{user.fullNameNe}
												</p>
											)}
											<p className="text-xs text-gray-400">{user.email}</p>
										</div>
									</div>
								</td>
								<td className="px-4 py-3">
									<RoleBadge role={user.role} />
									{user.specialization && (
										<p className="text-xs text-gray-500 mt-1">
											{user.specialization}
										</p>
									)}
								</td>
								<td className="px-4 py-3 text-gray-600 text-xs">
									{user.phone && (
										<div className="flex items-center gap-1">
											<Phone size={12} /> {user.phone}
										</div>
									)}
									{user.licenseNumber && <div>Lic: {user.licenseNumber}</div>}
								</td>
								<td className="px-4 py-3">
									<span
										className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
									>
										{user.isActive ? "Active" : "Inactive"}
									</span>
								</td>
								<td className="px-4 py-3">
									<div className="flex items-center gap-2">
										<button
											onClick={() => {
												setEditUser(user);
												setShowForm(true);
											}}
											className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
											title="Edit"
										>
											<Edit2 size={14} />
										</button>
										<button
											onClick={() => toggleActiveMutation.mutate(user.id)}
											className={`p-1.5 rounded ${user.isActive ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-green-400 hover:text-green-600 hover:bg-green-50"}`}
											title={user.isActive ? "Deactivate" : "Activate"}
										>
											<Power size={14} />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{showForm && (
				<UserFormModal user={editUser} onClose={() => setShowForm(false)} />
			)}
		</div>
	);
};

export default UsersPage;
