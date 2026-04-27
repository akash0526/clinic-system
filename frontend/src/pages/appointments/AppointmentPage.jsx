import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { appointmentsApi } from "../../api/appointments.api";
import { patientsApi } from "../../api/patients.api";
import BSDatePicker from "../../components/shared/BSDatePicker";
import { todayBSString } from "../../utils/bsDate";

// ─── Status badge ─────────────────────────────────────────
const StatusBadge = ({ status }) => {
	const map = {
		SCHEDULED: "bg-blue-100 text-blue-700",
		CONFIRMED: "bg-green-100 text-green-700",
		IN_PROGRESS: "bg-yellow-100 text-yellow-700",
		COMPLETED: "bg-gray-100 text-gray-600",
		CANCELLED: "bg-red-100 text-red-600",
		NO_SHOW: "bg-orange-100 text-orange-600",
	};
	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status]}`}
		>
			{status}
		</span>
	);
};

// ─── New Appointment Modal ─────────────────────────────────
const NewAppointmentModal = ({ onClose }) => {
	const queryClient = useQueryClient();

	const { data: doctors = [] } = useQuery({
		queryKey: ["doctors"],
		queryFn: () => appointmentsApi.getDoctors().then((r) => r.data.data),
	});

	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState(null);

	const { data: patients } = useQuery({
		queryKey: ["patient-search", patientSearch],
		queryFn: () =>
			patientsApi
				.list({ search: patientSearch, limit: 5 })
				.then((r) => r.data.data),
		enabled: patientSearch.length > 1,
	});

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm({
		defaultValues: {
			appointmentDateBS: todayBSString(),
			type: "OPD",
			duration: 15,
		},
	});

	const mutation = useMutation({
		mutationFn: (data) =>
			appointmentsApi.create({ ...data, patientId: selectedPatient.id }),
		onSuccess: () => {
			toast.success("Appointment booked!");
			queryClient.invalidateQueries(["appointments"]);
			onClose();
		},
	});

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
				<div className="flex items-center justify-between p-5 border-b">
					<h2 className="text-lg font-semibold">
						New Appointment / नयाँ अपोइन्टमेन्ट
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-xl"
					>
						×
					</button>
				</div>

				<form
					onSubmit={handleSubmit((d) => mutation.mutate(d))}
					className="p-5 space-y-4"
				>
					{/* Patient search */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Patient / बिरामी <span className="text-red-500">*</span>
						</label>
						{selectedPatient ? (
							<div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
								<div>
									<p className="text-sm font-medium">
										{selectedPatient.fullName}
									</p>
									<p className="text-xs text-gray-500">
										{selectedPatient.patientCode} · {selectedPatient.phone}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setSelectedPatient(null)}
									className="text-xs text-red-500 hover:underline"
								>
									Change
								</button>
							</div>
						) : (
							<div className="relative">
								<input
									value={patientSearch}
									onChange={(e) => setPatientSearch(e.target.value)}
									placeholder="Search by name, code or phone..."
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
								{patients?.length > 0 && (
									<div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
										{patients.map((p) => (
											<button
												type="button"
												key={p.id}
												onClick={() => {
													setSelectedPatient(p);
													setPatientSearch("");
												}}
												className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b last:border-0"
											>
												<div>
													<p className="font-medium">{p.fullName}</p>
													<p className="text-xs text-gray-400">
														{p.patientCode} · {p.phone}
													</p>
												</div>
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Doctor */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Doctor <span className="text-red-500">*</span>
						</label>
						<select
							{...register("doctorId", { required: true })}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="">Select doctor...</option>
							{doctors.map((d) => (
								<option key={d.id} value={d.id}>
									Dr. {d.fullName} — {d.specialization}
								</option>
							))}
						</select>
					</div>

					{/* Date BS */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Date (BS) <span className="text-red-500">*</span>
						</label>
						<Controller
							name="appointmentDateBS"
							control={control}
							render={({ field }) => (
								<BSDatePicker field={field} language="ne" />
							)}
						/>
					</div>

					{/* Time & Type */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Time <span className="text-red-500">*</span>
							</label>
							<input
								type="time"
								{...register("appointmentTime", { required: true })}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Type
							</label>
							<select
								{...register("type")}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
							>
								<option value="OPD">OPD</option>
								<option value="Follow-up">Follow-up</option>
								<option value="Emergency">Emergency</option>
							</select>
						</div>
					</div>

					{/* Chief complaint */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Chief Complaint
						</label>
						<textarea
							{...register("chiefComplaint")}
							rows={2}
							placeholder="Patient's main complaint..."
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!selectedPatient || mutation.isLoading}
							className="flex-1 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
						>
							{mutation.isLoading ? "Booking..." : "Book Appointment"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// ─── Main Page ─────────────────────────────────────────────
const AppointmentPage = () => {
	const [showModal, setShowModal] = useState(false);
	const [filterDate, setFilterDate] = useState(todayBSString());
	const [search, setSearch] = useState("");
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["appointments", { filterDate, search }],
		queryFn: () =>
			appointmentsApi.list({ dateBS: filterDate, search }).then((r) => r.data),
	});

	const statusMutation = useMutation({
		mutationFn: ({ id, status }) => appointmentsApi.updateStatus(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries(["appointments"]);
			toast.success("Status updated");
		},
	});

	return (
		<div className="p-6 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
					<p className="text-sm text-gray-500">
						{data?.meta?.total ?? 0} appointments
					</p>
				</div>
				<button
					onClick={() => setShowModal(true)}
					className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
				>
					<Plus size={16} /> New Appointment
				</button>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-xl border border-gray-200 mb-4">
				<div className="flex flex-wrap gap-3 p-4 items-center">
					<div className="relative flex-1 min-w-48">
						<Search
							size={15}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search patient..."
							className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Calendar size={15} className="text-gray-400" />
						<input
							type="date"
							onChange={(e) => {
								// Convert to BS or use AD directly
								setFilterDate(e.target.value);
							}}
							className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-y border-gray-200">
							<tr>
								{[
									"Token",
									"Patient",
									"Doctor",
									"Time",
									"Type",
									"Complaint",
									"Status",
									"Actions",
								].map((h) => (
									<th
										key={h}
										className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{isLoading && (
								<tr>
									<td
										colSpan={8}
										className="px-4 py-10 text-center text-gray-400"
									>
										Loading...
									</td>
								</tr>
							)}
							{!isLoading && !data?.data?.length && (
								<tr>
									<td
										colSpan={8}
										className="px-4 py-10 text-center text-gray-400"
									>
										No appointments found
									</td>
								</tr>
							)}
							{data?.data?.map((a) => (
								<tr key={a.id} className="hover:bg-gray-50">
									<td className="px-4 py-3">
										<span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
											{a.tokenNumber}
										</span>
									</td>
									<td className="px-4 py-3">
										<p className="font-medium text-gray-900">
											{a.patient?.fullName}
										</p>
										<p className="text-xs text-gray-400">
											{a.patient?.patientCode}
										</p>
									</td>
									<td className="px-4 py-3 text-gray-600">
										Dr. {a.doctor?.fullName}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-1 text-gray-600">
											<Clock size={13} />
											{a.appointmentTime}
										</div>
									</td>
									<td className="px-4 py-3 text-gray-600">{a.type}</td>
									<td className="px-4 py-3 text-gray-500 max-w-xs truncate">
										{a.chiefComplaint || "—"}
									</td>
									<td className="px-4 py-3">
										<StatusBadge status={a.status} />
									</td>
									<td className="px-4 py-3">
										<select
											value={a.status}
											onChange={(e) =>
												statusMutation.mutate({
													id: a.id,
													status: e.target.value,
												})
											}
											className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none"
										>
											{[
												"SCHEDULED",
												"CONFIRMED",
												"IN_PROGRESS",
												"COMPLETED",
												"CANCELLED",
												"NO_SHOW",
											].map((s) => (
												<option key={s} value={s}>
													{s}
												</option>
											))}
										</select>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{showModal && <NewAppointmentModal onClose={() => setShowModal(false)} />}
		</div>
	);
};

export default AppointmentPage;
