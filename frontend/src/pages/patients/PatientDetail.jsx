import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Edit2,
	Phone,
	MapPin,
	Droplets,
	AlertCircle,
	Calendar,
} from "lucide-react";
import { patientsApi } from "../../api/patients.api";

// FIXED: age calculation without require()
const calcAgeFromBS = (dobBS) => {
	if (!dobBS) return null;
	try {
		const dobYear = parseInt(dobBS.split("-")[0]);
		// Approximate current BS year
		const currentBSYear = new Date().getFullYear() + 56;
		const age = currentBSYear - dobYear;
		return age > 0 && age < 150 ? age : null;
	} catch {
		return null;
	}
};

const DetailRow = ({ label, value }) =>
	value ? (
		<div className="flex flex-col sm:flex-row sm:gap-4 py-1">
			<dt className="text-sm text-gray-500 sm:w-44 shrink-0">{label}</dt>
			<dd className="text-sm text-gray-900 font-medium">{value}</dd>
		</div>
	) : null;

const PatientDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const { data: patient, isLoading } = useQuery({
		queryKey: ["patient", id],
		queryFn: () => patientsApi.get(id).then((r) => r.data.data),
	});

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
			</div>
		);
	if (!patient)
		return <div className="p-6 text-red-500">Patient not found</div>;

	const age = calcAgeFromBS(patient.dobBS);

	return (
		<div className="p-6 max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<button
						onClick={() => navigate(-1)}
						className="p-2 hover:bg-gray-100 rounded-lg"
					>
						<ArrowLeft size={18} />
					</button>
					<div>
						<div className="flex items-center gap-3 flex-wrap">
							<h1 className="text-2xl font-bold text-gray-900">
								{patient.fullName}
							</h1>
							{patient.fullNameNe && (
								<span className="text-gray-400 font-nepali text-lg">
									{patient.fullNameNe}
								</span>
							)}
						</div>
						<div className="flex items-center gap-3 mt-1 flex-wrap">
							<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
								{patient.patientCode}
							</span>
							{patient.bloodGroup && (
								<span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
									<Droplets size={11} /> {patient.bloodGroup}
								</span>
							)}
							<span
								className={`text-xs px-2 py-0.5 rounded-full ${
									patient.gender === "MALE"
										? "bg-blue-100 text-blue-700"
										: patient.gender === "FEMALE"
											? "bg-pink-100 text-pink-700"
											: "bg-gray-100 text-gray-600"
								}`}
							>
								{patient.gender.charAt(0) +
									patient.gender.slice(1).toLowerCase()}
							</span>
						</div>
					</div>
				</div>
				<Link
					to={`/patients/${id}/edit`}
					className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
				>
					<Edit2 size={14} /> Edit
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Personal Info */}
				<div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
					<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
						Personal Information
					</h2>
					<dl className="space-y-1">
						<DetailRow label="Date of Birth (BS)" value={patient.dobBS} />
						<DetailRow
							label="Date of Birth (AD)"
							value={
								patient.dobAD
									? new Date(patient.dobAD).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})
									: null
							}
						/>
						<DetailRow label="Age" value={age ? `~${age} years` : null} />
						<DetailRow label="Phone" value={patient.phone} />
						<DetailRow label="Alt Phone" value={patient.phone2} />
						<DetailRow label="Email" value={patient.email} />
						<DetailRow
							label="Emergency Contact"
							value={
								patient.emergencyContact
									? `${patient.emergencyContact}${patient.emergencyContactRel ? ` (${patient.emergencyContactRel})` : ""}${patient.emergencyContactPhone ? " — " + patient.emergencyContactPhone : ""}`
									: null
							}
						/>
					</dl>
				</div>

				{/* Quick Actions */}
				<div className="bg-white rounded-xl border border-gray-200 p-5">
					<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
						Quick Actions
					</h2>
					<div className="space-y-2">
						<Link
							to={`/appointments?patientId=${id}`}
							className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
						>
							<Calendar size={15} /> Book Appointment
						</Link>
						{patient.phone && (
							<a
								href={`tel:${patient.phone}`}
								className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
							>
								<Phone size={15} /> Call Patient
							</a>
						)}
					</div>
					{patient.insuranceProvider && (
						<div className="mt-4 pt-4 border-t">
							<p className="text-xs text-gray-500 mb-1">Insurance</p>
							<p className="text-sm font-medium">{patient.insuranceProvider}</p>
							{patient.insurancePolicyNo && (
								<p className="text-xs text-gray-400">
									{patient.insurancePolicyNo}
								</p>
							)}
						</div>
					)}
				</div>

				{/* Address */}
				{(patient.province || patient.district || patient.municipality) && (
					<div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
						<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
							<MapPin size={14} /> Address / ठेगाना
						</h2>
						<dl className="space-y-1">
							<DetailRow label="Province" value={patient.province} />
							<DetailRow label="District" value={patient.district} />
							<DetailRow label="Municipality" value={patient.municipality} />
							<DetailRow label="Ward" value={patient.ward} />
							<DetailRow label="Tole / Street" value={patient.tole} />
						</dl>
					</div>
				)}

				{/* Allergies & Conditions */}
				{(patient.allergies?.length > 0 ||
					patient.chronicConditions?.length > 0) && (
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
							<AlertCircle size={14} className="text-red-500" /> Medical Alerts
						</h2>
						{patient.allergies?.length > 0 && (
							<div className="mb-3">
								<p className="text-xs text-gray-500 mb-2">Known Allergies</p>
								<div className="flex flex-wrap gap-1">
									{patient.allergies.map((a) => (
										<span
											key={a}
											className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
										>
											{a}
										</span>
									))}
								</div>
							</div>
						)}
						{patient.chronicConditions?.length > 0 && (
							<div>
								<p className="text-xs text-gray-500 mb-2">Chronic Conditions</p>
								<div className="flex flex-wrap gap-1">
									{patient.chronicConditions.map((c) => (
										<span
											key={c}
											className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
										>
											{c}
										</span>
									))}
								</div>
							</div>
						)}
						{patient.notes && (
							<div className="mt-3 pt-3 border-t">
								<p className="text-xs text-gray-500 mb-1">Notes</p>
								<p className="text-sm text-gray-700">{patient.notes}</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default PatientDetail;
