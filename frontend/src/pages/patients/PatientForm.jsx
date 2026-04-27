import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";
import BSDatePicker from "../../components/shared/BSDatePicker";
import { patientsApi } from "../../api/patients.api";

// ─── Nepal Address Data ───────────────────────────────────

const PROVINCES = [
	"Koshi",
	"Madhesh",
	"Bagmati",
	"Gandaki",
	"Lumbini",
	"Karnali",
	"Sudurpashchim",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// ─── Form Validation ─────────────────────────────────────

const formSchema = z.object({
	fullName: z.string().min(2, "Name required"),
	fullNameNe: z.string().optional(),
	gender: z.enum(["MALE", "FEMALE", "OTHER"], {
		required_error: "Gender is required",
	}),
	bloodGroup: z.string().optional(),
	dobBS: z.string().optional(),
	phone: z
		.string()
		.regex(/^[0-9]{10}$/, "10 digit phone number required")
		.optional()
		.or(z.literal("")),
	phone2: z.string().optional(),
	email: z.string().email().optional().or(z.literal("")),
	emergencyContact: z.string().optional(),
	emergencyContactPhone: z.string().optional(),
	emergencyContactRel: z.string().optional(),
	province: z.string().optional(),
	district: z.string().optional(),
	municipality: z.string().optional(),
	ward: z.string().optional(),
	tole: z.string().optional(),
	allergies: z.array(z.string()).default([]),
	chronicConditions: z.array(z.string()).default([]),
	notes: z.string().optional(),
	insuranceProvider: z.string().optional(),
	insurancePolicyNo: z.string().optional(),
});

// ─── Reusable Field Component ─────────────────────────────

const Field = ({ label, labelNe, error, required, children }) => (
	<div>
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label}
			{labelNe && (
				<span className="ml-2 text-gray-400 text-xs font-nepali">
					{labelNe}
				</span>
			)}
			{required && <span className="text-red-500 ml-1">*</span>}
		</label>
		{children}
		{error && <p className="mt-1 text-xs text-red-500">{error}</p>}
	</div>
);

const Input = ({ className = "", ...props }) => (
	<input
		className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
      disabled:bg-gray-100 ${className}`}
		{...props}
	/>
);

const Select = ({ children, className = "", ...props }) => (
	<select
		className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
		{...props}
	>
		{children}
	</select>
);

// ─── Multi-tag input for allergies/conditions ─────────────

const TagInput = ({ value = [], onChange, placeholder }) => {
	const add = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const val = e.target.value.trim().replace(",", "");
			if (val && !value.includes(val)) {
				onChange([...value, val]);
				e.target.value = "";
			}
		}
	};
	const remove = (tag) => onChange(value.filter((t) => t !== tag));

	return (
		<div className="border border-gray-300 rounded-lg p-2 min-h-[42px]">
			<div className="flex flex-wrap gap-1 mb-1">
				{value.map((tag) => (
					<span
						key={tag}
						className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full"
					>
						{tag}
						<button
							type="button"
							onClick={() => remove(tag)}
							className="hover:text-red-500"
						>
							×
						</button>
					</span>
				))}
			</div>
			<input
				type="text"
				onKeyDown={add}
				placeholder={value.length ? "" : placeholder}
				className="outline-none text-sm w-full"
			/>
		</div>
	);
};

// ─── Section Header ───────────────────────────────────────

const Section = ({ title }) => (
	<div className="col-span-full mt-2 mb-1">
		<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">
			{title}
		</h3>
	</div>
);

// ─── Main Form ────────────────────────────────────────────

const PatientForm = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams();
	const queryClient = useQueryClient();
	const isEditing = Boolean(id);

	const { data: existingPatient, isLoading: loadingPatient } = useQuery({
		queryKey: ["patient", id],
		queryFn: () => patientsApi.get(id).then((r) => r.data.data),
		enabled: isEditing,
	});

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: { gender: "MALE", allergies: [], chronicConditions: [] },
	});

	// Populate form when editing
	useEffect(() => {
		if (existingPatient) reset(existingPatient);
	}, [existingPatient, reset]);

	const mutation = useMutation({
		mutationFn: (data) =>
			isEditing ? patientsApi.update(id, data) : patientsApi.create(data),
		onSuccess: (res) => {
			toast.success(isEditing ? "Patient updated!" : "Patient registered!");
			queryClient.invalidateQueries(["patients"]);
			if (!isEditing) navigate(`/patients/${res.data.data.id}`);
		},
		onError: (err) => {
			const errors = err.response?.data?.errors;
			if (errors) {
				errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
			}
		},
	});

	const onSubmit = (data) => mutation.mutate(data);

	if (loadingPatient)
		return (
			<div className="flex items-center justify-center h-64 text-gray-400">
				Loading patient data...
			</div>
		);

	return (
		<div className="p-6 max-w-4xl mx-auto">
			{/* ── Header ───────────────────────────── */}
			<div className="flex items-center gap-4 mb-6">
				<button
					onClick={() => navigate(-1)}
					className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<ArrowLeft size={18} />
				</button>
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						{isEditing ? t("patient.edit") : t("patient.add")}
					</h1>
					{isEditing && existingPatient && (
						<p className="text-sm text-gray-500">
							{existingPatient.patientCode}
						</p>
					)}
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						{/* ── Personal Info ─────────────────── */}
						<Section title="Personal Information / व्यक्तिगत जानकारी" />

						<Field
							label="Full Name"
							labelNe="पुरा नाम"
							required
							error={errors.fullName?.message}
						>
							<Input
								{...register("fullName")}
								placeholder="Full name in English"
							/>
						</Field>

						<Field label="नाम (नेपालीमा)" error={errors.fullNameNe?.message}>
							<Input
								{...register("fullNameNe")}
								placeholder="पुरा नाम नेपालीमा"
								className="font-nepali"
							/>
						</Field>

						<Field
							label="Gender / लिङ्ग"
							required
							error={errors.gender?.message}
						>
							<Select {...register("gender")}>
								<option value="MALE">Male / पुरुष</option>
								<option value="FEMALE">Female / महिला</option>
								<option value="OTHER">Other / अन्य</option>
							</Select>
						</Field>

						<Field
							label="Blood Group / रक्त समूह"
							error={errors.bloodGroup?.message}
						>
							<Select {...register("bloodGroup")}>
								<option value="">Select...</option>
								{BLOOD_GROUPS.map((bg) => (
									<option key={bg} value={bg}>
										{bg}
									</option>
								))}
							</Select>
						</Field>

						{/* BS Date Picker */}
						<Field
							label="Date of Birth (BS) / जन्म मिति (बि.सं.)"
							error={errors.dobBS?.message}
						>
							<Controller
								name="dobBS"
								control={control}
								render={({ field }) => (
									<BSDatePicker field={field} language="ne" />
								)}
							/>
						</Field>

						{/* ── Contact Info ──────────────────── */}
						<Section title="Contact Information / सम्पर्क जानकारी" />

						<Field label="Phone / फोन" error={errors.phone?.message}>
							<Input
								{...register("phone")}
								placeholder="98XXXXXXXX"
								type="tel"
							/>
						</Field>

						<Field label="Alternate Phone" error={errors.phone2?.message}>
							<Input
								{...register("phone2")}
								placeholder="Secondary phone"
								type="tel"
							/>
						</Field>

						<Field label="Email" error={errors.email?.message}>
							<Input
								{...register("email")}
								placeholder="email@example.com"
								type="email"
							/>
						</Field>

						<Field
							label="Emergency Contact / आपतकालीन सम्पर्क"
							error={errors.emergencyContact?.message}
						>
							<Input
								{...register("emergencyContact")}
								placeholder="Contact person name"
							/>
						</Field>

						<Field
							label="Emergency Phone"
							error={errors.emergencyContactPhone?.message}
						>
							<Input
								{...register("emergencyContactPhone")}
								placeholder="Emergency contact phone"
								type="tel"
							/>
						</Field>

						<Field
							label="Relationship / नाताsambandha"
							error={errors.emergencyContactRel?.message}
						>
							<Select {...register("emergencyContactRel")}>
								<option value="">Select...</option>
								{[
									"Father",
									"Mother",
									"Spouse",
									"Son",
									"Daughter",
									"Sibling",
									"Other",
								].map((r) => (
									<option key={r} value={r}>
										{r}
									</option>
								))}
							</Select>
						</Field>

						{/* ── Address ───────────────────────── */}
						<Section title="Address / ठेगाना" />

						<Field label="Province / प्रदेश" error={errors.province?.message}>
							<Select {...register("province")}>
								<option value="">Select province...</option>
								{PROVINCES.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</Select>
						</Field>

						<Field label="District / जिल्ला" error={errors.district?.message}>
							<Input {...register("district")} placeholder="e.g. Kathmandu" />
						</Field>

						<Field
							label="Municipality / VDC"
							error={errors.municipality?.message}
						>
							<Input
								{...register("municipality")}
								placeholder="Municipality or VDC name"
							/>
						</Field>

						<Field label="Ward No. / वडा नं." error={errors.ward?.message}>
							<Input
								{...register("ward")}
								placeholder="Ward number"
								type="number"
								min="1"
								max="33"
							/>
						</Field>

						<Field label="Tole / Street" error={errors.tole?.message}>
							<Input
								{...register("tole")}
								placeholder="Tole / Street / Locality"
							/>
						</Field>

						{/* ── Medical History ───────────────── */}
						<Section title="Medical History / चिकित्सा इतिहास" />

						<div className="col-span-full">
							<Field
								label="Known Allergies / एलर्जीहरू (press Enter to add)"
								error={errors.allergies?.message}
							>
								<Controller
									name="allergies"
									control={control}
									render={({ field }) => (
										<TagInput
											value={field.value}
											onChange={field.onChange}
											placeholder="Type allergy and press Enter..."
										/>
									)}
								/>
							</Field>
						</div>

						<div className="col-span-full">
							<Field
								label="Chronic Conditions (press Enter to add)"
								error={errors.chronicConditions?.message}
							>
								<Controller
									name="chronicConditions"
									control={control}
									render={({ field }) => (
										<TagInput
											value={field.value}
											onChange={field.onChange}
											placeholder="e.g. Diabetes, Hypertension..."
										/>
									)}
								/>
							</Field>
						</div>

						<div className="col-span-full">
							<Field label="Notes / टिप्पणी" error={errors.notes?.message}>
								<textarea
									{...register("notes")}
									rows={3}
									placeholder="Additional notes about the patient..."
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
							</Field>
						</div>

						{/* ── Insurance ─────────────────────── */}
						<Section title="Insurance / बीमा" />

						<Field label="Insurance Provider">
							<Input
								{...register("insuranceProvider")}
								placeholder="Insurance company name"
							/>
						</Field>

						<Field label="Policy Number">
							<Input
								{...register("insurancePolicyNo")}
								placeholder="Policy / Member ID"
							/>
						</Field>
					</div>

					{/* ── Form Actions ─────────────────────── */}
					<div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						>
							{t("common.cancel")}
						</button>
						<button
							type="submit"
							disabled={mutation.isLoading || (!isDirty && isEditing)}
							className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Save size={15} />
							{mutation.isLoading ? "Saving..." : t("common.save")}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
};

export default PatientForm;
