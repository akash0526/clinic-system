import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import {
	Plus,
	Search,
	ChevronDown,
	ChevronUp,
	Stethoscope,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { patientsApi } from "../../api/patients.api";
import BSDatePicker from "../../components/shared/BSDatePicker";

const encountersApi = {
	list: (params) => api.get("/encounters", { params }),
	create: (data) => api.post("/encounters", data),
	update: (id, d) => api.put(`/encounters/${id}`, d),
	get: (id) => api.get(`/encounters/${id}`),
};

// ─── Vitals Input Row ──────────────────────────────────────
const VitalInput = ({ label, unit, ...props }) => (
	<div>
		<label className="block text-xs text-gray-500 mb-1">{label}</label>
		<div className="flex items-center gap-1">
			<input
				type="number"
				step="0.1"
				className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
				{...props}
			/>
			{unit && (
				<span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>
			)}
		</div>
	</div>
);

// ─── SOAP Textarea ────────────────────────────────────────
const SOAPField = ({ label, color, ...props }) => (
	<div>
		<label className={`block text-sm font-semibold mb-1 ${color}`}>
			{label}
		</label>
		<textarea
			rows={4}
			className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
			{...props}
		/>
	</div>
);

// ─── New Encounter Form ────────────────────────────────────
const NewEncounterModal = ({ onClose }) => {
	const queryClient = useQueryClient();
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState(null);

	const { data: patients } = useQuery({
		queryKey: ["patient-search-enc", patientSearch],
		queryFn: () =>
			patientsApi
				.list({ search: patientSearch, limit: 5 })
				.then((r) => r.data.data),
		enabled: patientSearch.length > 1,
	});

	const { register, control, handleSubmit } = useForm();

	const mutation = useMutation({
		mutationFn: (data) =>
			encountersApi.create({ ...data, patientId: selectedPatient.id }),
		onSuccess: () => {
			toast.success("Encounter saved!");
			queryClient.invalidateQueries(["encounters"]);
			onClose();
		},
	});

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
			<div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-6">
				<div className="flex items-center justify-between p-5 border-b">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<Stethoscope size={18} className="text-primary-600" /> New Encounter
						/ SOAP Note
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
					className="p-5 space-y-5"
				>
					{/* Patient */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Patient *
						</label>
						{selectedPatient ? (
							<div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
								<div>
									<p className="text-sm font-medium">
										{selectedPatient.fullName}
									</p>
									<p className="text-xs text-gray-500">
										{selectedPatient.patientCode}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setSelectedPatient(null)}
									className="text-xs text-red-500"
								>
									Change
								</button>
							</div>
						) : (
							<div className="relative">
								<input
									value={patientSearch}
									onChange={(e) => setPatientSearch(e.target.value)}
									placeholder="Search patient by name or code..."
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
												className="flex flex-col w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b last:border-0"
											>
												<span className="font-medium">{p.fullName}</span>
												<span className="text-xs text-gray-400">
													{p.patientCode} · {p.phone}
												</span>
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Vitals */}
					<div>
						<h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b">
							Vitals / जीवन संकेत
						</h3>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							<VitalInput
								label="Weight"
								unit="kg"
								{...register("weightKg", { valueAsNumber: true })}
							/>
							<VitalInput
								label="Height"
								unit="cm"
								{...register("heightCm", { valueAsNumber: true })}
							/>
							<VitalInput
								label="Temperature"
								unit="°C"
								{...register("temperature", { valueAsNumber: true })}
							/>
							<VitalInput
								label="Pulse Rate"
								unit="bpm"
								{...register("pulseRate", { valueAsNumber: true })}
							/>
							<VitalInput
								label="Resp. Rate"
								unit="/min"
								{...register("respiratoryRate", { valueAsNumber: true })}
							/>
							<VitalInput
								label="SpO2"
								unit="%"
								{...register("oxygenSaturation", { valueAsNumber: true })}
							/>
							<div className="col-span-2">
								<label className="block text-xs text-gray-500 mb-1">
									Blood Pressure
								</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										placeholder="Systolic"
										{...register("bloodPressureSystolic", {
											valueAsNumber: true,
										})}
										className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
									/>
									<span className="text-gray-400">/</span>
									<input
										type="number"
										placeholder="Diastolic"
										{...register("bloodPressureDiastolic", {
											valueAsNumber: true,
										})}
										className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
									/>
									<span className="text-xs text-gray-400">mmHg</span>
								</div>
							</div>
							<VitalInput
								label="Blood Sugar"
								unit="mg/dL"
								{...register("bloodSugar", { valueAsNumber: true })}
							/>
						</div>
					</div>

					{/* SOAP */}
					<div>
						<h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b">
							SOAP Notes
						</h3>
						<div className="space-y-3">
							<SOAPField
								label="S — Subjective (Chief Complaint & History)"
								color="text-blue-600"
								placeholder="Patient's complaint, history of present illness, review of systems..."
								{...register("subjective")}
							/>
							<SOAPField
								label="O — Objective (Examination Findings)"
								color="text-green-600"
								placeholder="Physical examination findings, test results..."
								{...register("objective")}
							/>
							<SOAPField
								label="A — Assessment (Diagnosis)"
								color="text-amber-600"
								placeholder="Diagnosis, differential diagnosis, ICD codes..."
								{...register("assessment")}
							/>
							<SOAPField
								label="P — Plan (Treatment)"
								color="text-purple-600"
								placeholder="Medications, procedures, referrals, follow-up..."
								{...register("plan")}
							/>
						</div>
					</div>

					{/* Follow up */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Follow-up Date (BS)
						</label>
						<Controller
							name="followUpDateBS"
							control={control}
							render={({ field }) => <BSDatePicker field={field} />}
						/>
					</div>

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
							disabled={!selectedPatient || mutation.isLoading}
							className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
						>
							{mutation.isLoading ? "Saving..." : "Save Encounter"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// ─── Main ─────────────────────────────────────────────────
const EncounterPage = () => {
	const [showModal, setShowModal] = useState(false);
	const [search, setSearch] = useState("");

	const { data, isLoading } = useQuery({
		queryKey: ["encounters", search],
		queryFn: () => encountersApi.list({ search }).then((r) => r.data),
	});

	return (
		<div className="p-6 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Encounters / भेटघाट</h1>
				<button
					onClick={() => setShowModal(true)}
					className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
				>
					<Plus size={16} /> New Encounter
				</button>
			</div>

			<div className="bg-white rounded-xl border border-gray-200">
				<div className="p-4 border-b">
					<div className="relative max-w-sm">
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
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b">
							<tr>
								{[
									"Patient",
									"Doctor",
									"Visit Date (BS)",
									"BP",
									"Pulse",
									"Assessment",
									"Prescriptions",
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
										colSpan={7}
										className="px-4 py-10 text-center text-gray-400"
									>
										Loading...
									</td>
								</tr>
							)}
							{data?.data?.map((enc) => (
								<tr key={enc.id} className="hover:bg-gray-50">
									<td className="px-4 py-3">
										<p className="font-medium">{enc.patient?.fullName}</p>
										<p className="text-xs text-gray-400">
											{enc.patient?.patientCode}
										</p>
									</td>
									<td className="px-4 py-3 text-gray-600">
										Dr. {enc.doctor?.fullName}
									</td>
									<td className="px-4 py-3 text-gray-600">{enc.visitDateBS}</td>
									<td className="px-4 py-3 text-gray-600">
										{enc.bloodPressureSystolic
											? `${enc.bloodPressureSystolic}/${enc.bloodPressureDiastolic}`
											: "—"}
									</td>
									<td className="px-4 py-3 text-gray-600">
										{enc.pulseRate ? `${enc.pulseRate} bpm` : "—"}
									</td>
									<td className="px-4 py-3 text-gray-600 max-w-xs truncate">
										{enc.assessment || "—"}
									</td>
									<td className="px-4 py-3">
										<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
											{enc.prescriptions?.length ?? 0} Rx
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{showModal && <NewEncounterModal onClose={() => setShowModal(false)} />}
		</div>
	);
};

export default EncounterPage;
