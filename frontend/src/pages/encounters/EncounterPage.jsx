import { useState, forwardRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { X, Plus, Search, Stethoscope } from "lucide-react";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { patientsApi } from "../../api/patients.api";
import { formatDate } from "../../utils/date";

const encountersApi = {
	list: (params) => api.get("/encounters", { params }),
	create: (data) => api.post("/encounters", data),
	update: (id, d) => api.put(`/encounters/${id}`, d),
	get: (id) => api.get(`/encounters/${id}`),
};

const VitalInput = forwardRef(({ label, unit, ...rest }, ref) => (
	<div>
		<label className="block text-xs text-gray-500 mb-1">{label}</label>
		<div className="flex items-center gap-1">
			<input
				ref={ref}
				type="number"
				step="0.1"
				className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
				{...rest}
			/>
			{unit && <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>}
		</div>
	</div>
));

const SOAPField = forwardRef(({ label, color, ...rest }, ref) => (
	<div>
		<label className={`block text-sm font-semibold mb-1 ${color}`}>{label}</label>
		<textarea
			ref={ref}
			rows={4}
			className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm resize-none"
			{...rest}
		/>
	</div>
));

const cleanFormData = (data) => {
	const cleaned = {};
	for (const key in data) {
		const val = data[key];
		if (val === "" || val === null || val === undefined || Number.isNaN(val)) continue;
		cleaned[key] = typeof val === "string" && !isNaN(Number(val)) ? Number(val) : val;
	}
	return cleaned;
};

const NewEncounterModal = ({ onClose }) => {
	const queryClient = useQueryClient();
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState(null);

	const { data: patients } = useQuery({
		queryKey: ["patient-search-enc", patientSearch],
		queryFn: () => patientsApi.list({ search: patientSearch, limit: 5 }).then((r) => r.data.data),
		enabled: patientSearch.length > 1,
	});

	const { register, handleSubmit } = useForm();

	const mutation = useMutation({
		mutationFn: (data) => encountersApi.create({ ...data, patientId: selectedPatient.id }),
		onSuccess: () => {
			toast.success("Encounter saved!");
			queryClient.invalidateQueries(["encounters"]);
			onClose();
		},
	});

	const onSubmit = (data) => mutation.mutate(cleanFormData(data));

	return (
		<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in z-50 flex items-start justify-center p-4 overflow-y-auto">
			<div className="relative bg-white rounded-2xl border border-slate-200/70 shadow-pop animate-scale-in w-full max-w-2xl my-6">
				<div className="flex items-center justify-between p-5 border-b">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<Stethoscope size={18} className="text-primary-600" /> New Encounter / SOAP Note
					</h2>
					<button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
						{selectedPatient ? (
							<div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
								<div>
									<p className="text-sm font-medium">{selectedPatient.fullName}</p>
									<p className="text-xs text-gray-500">{selectedPatient.patientCode}</p>
								</div>
								<button type="button" onClick={() => setSelectedPatient(null)} className="text-xs text-red-500">
									Change
								</button>
							</div>
						) : (
							<div className="relative">
								<input
									value={patientSearch}
									onChange={(e) => setPatientSearch(e.target.value)}
									placeholder="Search patient by name or code..."
									className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
								/>
								{patients?.length > 0 && (
									<div className="absolute top-full left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-lg z-10 mt-1">
										{patients.map((p) => (
											<button
												type="button"
												key={p.id}
												onClick={() => {
													setSelectedPatient(p);
													setPatientSearch("");
												}}
												className="flex w-full flex-col border-b border-slate-100 px-3.5 py-2.5 text-left text-[13px] transition last:border-0 hover:bg-slate-50"
											>
												<span className="font-medium">{p.fullName}</span>
												<span className="text-xs text-gray-400">{p.patientCode} · {p.phone}</span>
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					<div>
						<h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b">Vitals / जीवन संकेत</h3>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							<VitalInput label="Weight" unit="kg" {...register("weightKg")} />
							<VitalInput label="Height" unit="cm" {...register("heightCm")} />
							<VitalInput label="Temperature" unit="°C" {...register("temperature")} />
							<VitalInput label="Pulse Rate" unit="bpm" {...register("pulseRate")} />
							<VitalInput label="Resp. Rate" unit="/min" {...register("respiratoryRate")} />
							<VitalInput label="SpO2" unit="%" {...register("oxygenSaturation")} />
							<div className="col-span-2">
								<label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										placeholder="Systolic"
										{...register("bloodPressureSystolic")}
										className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
									/>
									<span className="text-gray-400">/</span>
									<input
										type="number"
										placeholder="Diastolic"
										{...register("bloodPressureDiastolic")}
										className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
									/>
									<span className="text-xs text-gray-400">mmHg</span>
								</div>
							</div>
							<VitalInput label="Blood Sugar" unit="mg/dL" {...register("bloodSugar")} />
						</div>
					</div>

					<div>
						<h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b">SOAP Notes</h3>
						<div className="space-y-3">
							<SOAPField
								label="S — Subjective (Chief Complaint & History)"
								color="text-blue-600"
								placeholder="Patient's complaint, history of present illness..."
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

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
						<input
							type="date"
							{...register("followUpDateAD")}
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
						/>
					</div>

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
							disabled={!selectedPatient || mutation.isPending}
							className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
						>
							{mutation.isPending ? "Saving..." : "Save Encounter"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

const EncounterPage = () => {
	const [showModal, setShowModal] = useState(false);
	const [search, setSearch] = useState("");

	const { data, isLoading } = useQuery({
		queryKey: ["encounters", search],
		queryFn: () => encountersApi.list({ search }).then((r) => r.data),
	});

	return (
		<div className="page">
			<PageHeader
				title="Encounters"
				description="Visit notes and SOAP records · भेटघाट"
				actions={
					<Button icon={Plus} onClick={() => setShowModal(true)}>
						New encounter
					</Button>
				}
			/>

			<div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
				<div className="p-4 border-b">
					<div className="relative max-w-sm">
						<Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search patient..."
							className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm"
						/>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-slate-50/80">
							<tr>
								{["Patient", "Doctor", "Visit Date", "BP", "Pulse", "Assessment", "Prescriptions"].map((h) => (
									<th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{isLoading && (
								<tr>
									<td colSpan={7} className="px-4 py-10 text-center text-gray-400">
										Loading...
									</td>
								</tr>
							)}
							{data?.data?.map((enc) => (
								<tr key={enc.id} className="transition-colors hover:bg-slate-50/70">
									<td className="px-4 py-3.5">
										<p className="font-medium">{enc.patient?.fullName}</p>
										<p className="text-xs text-gray-400">{enc.patient?.patientCode}</p>
									</td>
									<td className="px-4 py-3.5 text-slate-600">Dr. {enc.doctor?.fullName}</td>
									<td className="px-4 py-3.5 text-slate-600">{formatDate(enc.visitDateAD)}</td>
									<td className="px-4 py-3.5 text-slate-600">
										{enc.bloodPressureSystolic ? `${enc.bloodPressureSystolic}/${enc.bloodPressureDiastolic}` : "—"}
									</td>
									<td className="px-4 py-3.5 text-slate-600">{enc.pulseRate ? `${enc.pulseRate} bpm` : "—"}</td>
									<td className="px-4 py-3 text-gray-600 max-w-xs truncate">{enc.assessment || "—"}</td>
									<td className="px-4 py-3.5">
										<span className="text-xs bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70 px-2 py-0.5 rounded-full">
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
