import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
	Plus,
	Calendar,
	Clock,
	CalendarX2,
	ChevronLeft,
	ChevronRight,
	Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { appointmentsApi } from "../../api/appointments.api";
import { patientsApi } from "../../api/patients.api";
import { todayDateInputValue, formatDate, toDateInputValue } from "../../utils/date";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import { StatusBadge } from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import Input, { SearchInput, Select, Textarea } from "../../components/ui/Input";
import {
	TableWrap,
	THead,
	TH,
	TBody,
	TR,
	TD,
	TableState,
} from "../../components/ui/Table";
import { cn } from "../../utils/cn";

const STATUSES = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

// ─── New appointment modal ────────────────────────────────
const NewAppointmentModal = ({ onClose }) => {
	const queryClient = useQueryClient();
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState(null);

	const { data: doctors = [] } = useQuery({
		queryKey: ["doctors"],
		queryFn: () => appointmentsApi.getDoctors().then((r) => r.data.data),
	});

	const { data: patients } = useQuery({
		queryKey: ["patient-search", patientSearch],
		queryFn: () =>
			patientsApi.list({ search: patientSearch, limit: 5 }).then((r) => r.data.data),
		enabled: patientSearch.length > 1,
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		defaultValues: {
			appointmentDateAD: todayDateInputValue(),
			appointmentTime: "10:00",
			type: "OPD",
			duration: 15,
		},
	});

	const mutation = useMutation({
		mutationFn: (data) => appointmentsApi.create({ ...data, patientId: selectedPatient.id }),
		onSuccess: () => {
			toast.success("Appointment booked");
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
			onClose();
		},
		onError: (err) =>
			toast.error(err.response?.data?.message || "Could not book the appointment"),
	});

	return (
		<Modal
			onClose={onClose}
			size="xl"
			icon={Calendar}
			title="New appointment"
			description="Pick a patient, a doctor and a time slot."
			footer={
				<>
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button
						form="new-appointment-form"
						type="submit"
						loading={mutation.isPending}
						disabled={!selectedPatient}
						icon={Check}
					>
						Book appointment
					</Button>
				</>
			}
		>
			<form
				id="new-appointment-form"
				onSubmit={handleSubmit((d) => mutation.mutate(d))}
				className="space-y-4"
			>
				{/* Patient picker */}
				<div>
					<label className="label">
						Patient <span className="text-rose-500">*</span>
					</label>
					{selectedPatient ? (
						<div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3.5 py-3">
							<Avatar name={selectedPatient.fullName} size="sm" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13.5px] font-medium text-slate-900">
									{selectedPatient.fullName}
								</p>
								<p className="truncate text-[11.5px] text-slate-500">
									{selectedPatient.patientCode}
									{selectedPatient.phone ? ` · ${selectedPatient.phone}` : ""}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setSelectedPatient(null)}
								className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
							>
								Change
							</button>
						</div>
					) : (
						<div className="relative">
							<SearchInput
								value={patientSearch}
								onChange={(e) => setPatientSearch(e.target.value)}
								placeholder="Search by name, code or phone…"
								autoFocus
							/>
							{patientSearch.length > 1 && (
								<div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
									{patients?.length ? (
										patients.map((p) => (
											<button
												key={p.id}
												type="button"
												onClick={() => {
													setSelectedPatient(p);
													setPatientSearch("");
												}}
												className="flex w-full items-center gap-3 border-b border-slate-100 px-3.5 py-2.5 text-left transition last:border-0 hover:bg-slate-50"
											>
												<Avatar name={p.fullName} size="xs" />
												<span className="min-w-0 flex-1">
													<p className="truncate text-[13px] font-medium text-slate-800">
														{p.fullName}
													</p>
													<p className="truncate text-[11px] text-slate-400">
														{p.patientCode}
														{p.phone ? ` · ${p.phone}` : ""}
													</p>
												</span>
											</button>
										))
									) : (
										<p className="px-3.5 py-4 text-center text-xs text-slate-400">
											No patients found
										</p>
									)}
								</div>
							)}
						</div>
					)}
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<Select
						label="Doctor"
						required
						{...register("doctorId", { required: true })}
						error={errors.doctorId && "Please choose a doctor"}
					>
						<option value="">Select doctor…</option>
						{doctors.map((d) => (
							<option key={d.id} value={d.id}>
								Dr. {d.fullName}
								{d.specialization ? ` — ${d.specialization}` : ""}
							</option>
						))}
					</Select>

					<Select label="Visit type" {...register("type")}>
						<option value="OPD">OPD</option>
						<option value="Follow-up">Follow-up</option>
						<option value="Emergency">Emergency</option>
					</Select>

					<Input
						label="Date"
						type="date"
						required
						{...register("appointmentDateAD", { required: true })}
					/>

					<Input
						label="Time"
						type="time"
						required
						{...register("appointmentTime", { required: true })}
					/>
				</div>

				<Textarea
					label="Chief complaint"
					rows={3}
					placeholder="Patient's main complaint…"
					{...register("chiefComplaint")}
				/>
			</form>
		</Modal>
	);
};

// ─── Page ─────────────────────────────────────────────────
const AppointmentPage = () => {
	const [showModal, setShowModal] = useState(false);
	const [filterDate, setFilterDate] = useState(todayDateInputValue());
	const [search, setSearch] = useState("");
	const queryClient = useQueryClient();

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["appointments", { filterDate, search }],
		queryFn: () => appointmentsApi.list({ date: filterDate, search }).then((r) => r.data),
		keepPreviousData: true,
	});

	const statusMutation = useMutation({
		mutationFn: ({ id, status }) => appointmentsApi.updateStatus(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
			toast.success("Status updated");
		},
	});

	const shiftDay = (days) => {
		const d = new Date(`${filterDate}T00:00:00`);
		d.setDate(d.getDate() + days);
		setFilterDate(toDateInputValue(d));
	};

	const isToday = filterDate === todayDateInputValue();
	const rows = data?.data ?? [];

	return (
		<div className="page">
			<PageHeader
				title="Appointments"
				description={`${data?.meta?.total ?? 0} ${
					data?.meta?.total === 1 ? "appointment" : "appointments"
				} · ${formatDate(filterDate)}`}
				actions={
					<Button icon={Plus} onClick={() => setShowModal(true)}>
						New appointment
					</Button>
				}
			/>

			<Card className="overflow-hidden">
				<div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
					<SearchInput
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search patient…"
						className="w-full lg:max-w-xs"
					/>

					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
							<button
								onClick={() => shiftDay(-1)}
								className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
								aria-label="Previous day"
							>
								<ChevronLeft size={16} />
							</button>
							<input
								type="date"
								value={filterDate}
								onChange={(e) => setFilterDate(e.target.value)}
								className="h-8 border-0 bg-transparent px-1 text-[13px] shadow-none focus:ring-0"
							/>
							<button
								onClick={() => shiftDay(1)}
								className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
								aria-label="Next day"
							>
								<ChevronRight size={16} />
							</button>
						</div>

						<button
							onClick={() => setFilterDate(todayDateInputValue())}
							className={cn(
								"h-9 rounded-xl px-3 text-xs font-medium transition",
								isToday
									? "bg-brand-50 text-brand-700"
									: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
							)}
						>
							Today
						</button>
					</div>
				</div>

				<TableWrap>
					<THead>
						<tr>
							<TH className="w-16">Token</TH>
							<TH>Patient</TH>
							<TH className="hidden lg:table-cell">Doctor</TH>
							<TH>Time</TH>
							<TH className="hidden md:table-cell">Type</TH>
							<TH className="hidden xl:table-cell">Complaint</TH>
							<TH>Status</TH>
							<TH className="text-right">Update</TH>
						</tr>
					</THead>
					<TBody className={cn(isFetching && "opacity-60 transition-opacity")}>
						{isLoading && <TableState loading />}

						{!isLoading && rows.length === 0 && (
							<tr>
								<td colSpan={8}>
									<EmptyState
										icon={CalendarX2}
										title="No appointments for this day"
										description="Choose another date, or book a new appointment for this patient."
										action={
											<Button
												size="sm"
												icon={Plus}
												onClick={() => setShowModal(true)}
											>
												New appointment
											</Button>
										}
									/>
								</td>
							</tr>
						)}

						{rows.map((a) => (
							<TR key={a.id}>
								<TD>
									<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
										{a.tokenNumber ?? "—"}
									</span>
								</TD>
								<TD>
									<div className="flex items-center gap-2.5">
										<Avatar name={a.patient?.fullName} size="xs" className="hidden sm:inline-flex" />
										<div className="min-w-0">
											<p className="truncate text-[13.5px] font-medium text-slate-900">
												{a.patient?.fullName}
											</p>
											<p className="truncate text-[11px] text-slate-400">
												{a.patient?.patientCode}
												<span className="lg:hidden">
													{a.doctor?.fullName ? ` · Dr. ${a.doctor.fullName}` : ""}
												</span>
											</p>
										</div>
									</div>
								</TD>
								<TD className="hidden lg:table-cell">
									<p className="text-[13px] text-slate-700">
										{a.doctor?.fullName ? `Dr. ${a.doctor.fullName}` : "—"}
									</p>
								</TD>
								<TD>
									<span className="inline-flex items-center gap-1.5 text-[13px] text-slate-700">
										<Clock size={13} className="text-slate-400" />
										{a.appointmentTime}
									</span>
								</TD>
								<TD className="hidden md:table-cell">
									<span className="text-[12px] text-slate-500">{a.type}</span>
								</TD>
								<TD className="hidden max-w-[200px] truncate xl:table-cell">
									{a.chiefComplaint || <span className="text-slate-300">—</span>}
								</TD>
								<TD>
									<StatusBadge status={a.status} />
								</TD>
								<TD className="text-right">
									<select
										value={a.status}
										onChange={(e) =>
											statusMutation.mutate({ id: a.id, status: e.target.value })
										}
										aria-label={`Update status for ${a.patient?.fullName}`}
										className="h-8 w-[132px] cursor-pointer rounded-lg py-1 pl-2 pr-7 text-[11.5px] capitalize"
									>
										{STATUSES.map((s) => (
											<option key={s} value={s}>
												{s.replaceAll("_", " ").toLowerCase()}
											</option>
										))}
									</select>
								</TD>
							</TR>
						))}
					</TBody>
				</TableWrap>
			</Card>

			{showModal && <NewAppointmentModal onClose={() => setShowModal(false)} />}
		</div>
	);
};

export default AppointmentPage;
