import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Pencil,
	Phone,
	MapPin,
	Droplets,
	AlertCircle,
	Calendar,
	CreditCard,
	UserRound,
	ShieldCheck,
} from "lucide-react";
import { patientsApi } from "../../api/patients.api";
import { calculateAge, formatDate } from "../../utils/date";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import { Skeleton } from "../../components/ui/Skeleton";

const DetailRow = ({ label, value }) =>
	value ? (
		<div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
			<dt className="shrink-0 text-[12.5px] text-slate-500 sm:w-40">{label}</dt>
			<dd className="text-[13.5px] font-medium text-slate-800">{value}</dd>
		</div>
	) : null;

const SectionCard = ({ icon: Icon, title, children, className }) => (
	<section
		className={`rounded-2xl border border-slate-200/80 bg-white shadow-soft ${className || ""}`}
	>
		<header className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
			{Icon && (
				<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
					<Icon size={15} />
				</span>
			)}
			<h2 className="text-[13px] font-semibold text-slate-800">{title}</h2>
		</header>
		<div className="px-5 py-3">{children}</div>
	</section>
);

const PatientDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const { data: patient, isLoading } = useQuery({
		queryKey: ["patient", id],
		queryFn: () => patientsApi.get(id).then((r) => r.data.data),
	});

	if (isLoading)
		return (
			<div className="page max-w-5xl space-y-5">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-32 w-full rounded-2xl" />
				<div className="grid gap-5 md:grid-cols-3">
					<Skeleton className="h-64 rounded-2xl md:col-span-2" />
					<Skeleton className="h-64 rounded-2xl" />
				</div>
			</div>
		);

	if (!patient)
		return (
			<div className="page max-w-5xl">
				<div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-soft">
					<p className="text-sm font-medium text-slate-700">Patient not found</p>
					<p className="mt-1 text-xs text-slate-500">
						The record may have been removed or the link is incorrect.
					</p>
					<Button
						size="sm"
						variant="secondary"
						className="mt-4"
						onClick={() => navigate("/patients")}
					>
						Back to patients
					</Button>
				</div>
			</div>
		);

	const age = calculateAge(patient.dobAD);
	const genderLabel = patient.gender
		? patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()
		: null;
	const address = [patient.tole, patient.municipality, patient.district, patient.province]
		.filter(Boolean)
		.join(", ");

	return (
		<div className="page max-w-5xl">
			<button
				onClick={() => navigate(-1)}
				className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13px] font-medium text-slate-500 transition hover:text-slate-800"
			>
				<ArrowLeft size={15} /> Back
			</button>

			{/* Patient hero */}
			<div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
					<Avatar name={patient.fullName} size="lg" />
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
							<h1 className="text-xl font-semibold tracking-tight text-slate-900">
								{patient.fullName}
							</h1>
							{patient.fullNameNe && (
								<span className="text-base text-slate-400 font-nepali">
									{patient.fullNameNe}
								</span>
							)}
						</div>

						<div className="mt-2.5 flex flex-wrap items-center gap-2">
							<span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
								<CreditCard size={12} /> {patient.patientCode}
							</span>
							{genderLabel && <Badge tone="brand">{genderLabel}</Badge>}
							{patient.bloodGroup && (
								<Badge tone="red">
									<Droplets size={11} /> {patient.bloodGroup}
								</Badge>
							)}
							{age != null && (
								<Badge tone="neutral">{age} years</Badge>
							)}
						</div>

						<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-slate-500">
							{patient.phone && (
								<span className="inline-flex items-center gap-1.5">
									<Phone size={13} className="text-slate-400" />
									{patient.phone}
								</span>
							)}
							{address && (
								<span className="inline-flex items-center gap-1.5">
									<MapPin size={13} className="text-slate-400" />
									{address}
								</span>
							)}
						</div>
					</div>

					<Button
						as={Link}
						to={`/patients/${id}/edit`}
						variant="secondary"
						icon={Pencil}
						className="shrink-0 self-start"
					>
						Edit patient
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
				<SectionCard
					icon={UserRound}
					title="Personal information"
					className="md:col-span-2"
				>
					<dl className="divide-y divide-slate-100">
						<DetailRow
							label="Date of birth"
							value={patient.dobAD ? formatDate(patient.dobAD) : null}
						/>
						<DetailRow label="Age" value={age != null ? `${age} years` : null} />
						<DetailRow label="Gender" value={genderLabel} />
						<DetailRow label="Phone" value={patient.phone} />
						<DetailRow label="Alternate phone" value={patient.phone2} />
						<DetailRow label="Email" value={patient.email} />
						<DetailRow
							label="Emergency contact"
							value={
								patient.emergencyContact
									? `${patient.emergencyContact}${
											patient.emergencyContactRel
												? ` (${patient.emergencyContactRel})`
												: ""
										}${
											patient.emergencyContactPhone
												? ` — ${patient.emergencyContactPhone}`
												: ""
										}`
									: null
							}
						/>
						{patient.notes && <DetailRow label="Notes" value={patient.notes} />}
					</dl>
				</SectionCard>

				<SectionCard icon={Calendar} title="Quick actions">
					<div className="space-y-2 py-1.5">
						<Link
							to={`/appointments?patientId=${id}`}
							className="flex w-full items-center gap-2.5 rounded-xl bg-brand-50 px-3 py-2.5 text-[13px] font-medium text-brand-700 transition hover:bg-brand-100"
						>
							<Calendar size={15} /> Book appointment
						</Link>
						{patient.phone && (
							<a
								href={`tel:${patient.phone}`}
								className="flex w-full items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-100"
							>
								<Phone size={15} /> Call patient
							</a>
						)}
					</div>

					{patient.insuranceProvider && (
						<div className="mt-3 border-t border-slate-100 pt-3">
							<p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
								<ShieldCheck size={12} /> Insurance
							</p>
							<p className="mt-1 text-[13px] font-medium text-slate-800">
								{patient.insuranceProvider}
							</p>
							{patient.insurancePolicyNo && (
								<p className="text-[11.5px] text-slate-400">
									{patient.insurancePolicyNo}
								</p>
							)}
						</div>
					)}
				</SectionCard>

				{(patient.province || patient.district || patient.municipality) && (
					<SectionCard icon={MapPin} title="Address" className="md:col-span-2">
						<dl className="divide-y divide-slate-100">
							<DetailRow label="Province" value={patient.province} />
							<DetailRow label="District" value={patient.district} />
							<DetailRow label="Municipality / VDC" value={patient.municipality} />
							<DetailRow label="Ward" value={patient.ward} />
							<DetailRow label="Tole / Street" value={patient.tole} />
						</dl>
					</SectionCard>
				)}

				{(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
					<SectionCard icon={AlertCircle} title="Medical alerts">
						{patient.allergies?.length > 0 && (
							<div className="py-2">
								<p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
									Known allergies
								</p>
								<div className="flex flex-wrap gap-1.5">
									{patient.allergies.map((a) => (
										<Badge key={a} tone="red" size="sm">
											{a}
										</Badge>
									))}
								</div>
							</div>
						)}
						{patient.chronicConditions?.length > 0 && (
							<div className="border-t border-slate-100 py-2">
								<p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
									Chronic conditions
								</p>
								<div className="flex flex-wrap gap-1.5">
									{patient.chronicConditions.map((c) => (
										<Badge key={c} tone="amber" size="sm">
											{c}
										</Badge>
									))}
								</div>
							</div>
						)}
					</SectionCard>
				)}
			</div>
		</div>
	);
};

export default PatientDetail;
