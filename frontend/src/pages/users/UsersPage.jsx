import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Edit2, Power, Phone } from "lucide-react";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import toast from "react-hot-toast";
import api from "../../api/axios";

const usersApi = {
	list: () => api.get("/users"),
	create: (data) => api.post("/users", data),
	update: (id, data) => api.put(`/users/${id}`, data),
	toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
};

const ROLE_COLORS = {
	ADMIN: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/70",
	DOCTOR: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70",
	RECEPTIONIST: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70",
	LAB_TECH: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/70",
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

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in z-50 flex items-center justify-center p-4">
			<div className="relative bg-white rounded-2xl border border-slate-200/70 shadow-pop animate-scale-in w-full max-w-md">
				<div className="flex items-center justify-between p-5 border-b">
					<h2 className="text-lg font-semibold">
						{isEditing ? "Edit User" : "Add New User"}
					</h2>
					<button
						onClick={onClose}
						className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
					>
						<X size={18} />
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
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
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
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
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
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
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
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-nepali"
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
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white"
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
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
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
									className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
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
									className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
								/>
							</div>
						</>
					)}

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-gray-50"
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
		<div className="page">
			<PageHeader
				title="Users"
				description="Staff accounts, roles and access"
				actions={
					<Button
						icon={Plus}
						onClick={() => {
							setEditUser(null);
							setShowForm(true);
						}}
					>
						Add user
					</Button>
				}
			/>

			<div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
				<table className="w-full text-sm">
					<thead className="bg-slate-50/80">
						<tr>
							<th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								User
							</th>
							<th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								Role
							</th>
							<th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								Contact
							</th>
							<th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								Status
							</th>
							<th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
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
							<tr key={user.id} className="transition-colors hover:bg-slate-50/70">
								<td className="px-4 py-3.5">
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
								<td className="px-4 py-3.5">
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
								<td className="px-4 py-3.5">
									<span
										className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70" : "bg-gray-100 text-gray-500"}`}
									>
										{user.isActive ? "Active" : "Inactive"}
									</span>
								</td>
								<td className="px-4 py-3.5">
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
