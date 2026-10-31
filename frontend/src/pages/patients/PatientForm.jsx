import { useEffect, forwardRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";
import { patientsApi } from "../../api/patients.api";
import { toDateInputValue } from "../../utils/date";

// ─── Nepal Address Data ───────────────────────────────────
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// ─── Form Validation ─────────────────────────────────────
const formSchema = z.object({
	fullName: z.string().min(2, "Name required"),
	fullNameNe: z.string().optional(),
	gender: z.enum(["MALE", "FEMALE", "OTHER"], {
		required_error: "Gender is required",
	}),
	bloodGroup: z.string().optional(),
	dobAD: z.string().optional(),
	phone: z
		.string()
		.regex(/^[0-9]{10}$/, "10 digit phone number required")
		.optional()
		.or(z.literal("")),
	phone2: z.string().optional().or(z.literal("")),
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

// ─── Reusable Components with forwardRef ──────────────────
const Input = forwardRef(({ className = "", ...props }, ref) => (
	<input
		ref={ref}
		className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm
      disabled:bg-gray-100 ${className}`}
		{...props}
	/>
));

const Select = forwardRef(({ children, className = "", ...props }, ref) => (
	<select
		ref={ref}
		className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white ${className}`}
		{...props}
	>
		{children}
	</select>
));

const Textarea = forwardRef(({ className = "", ...props }, ref) => (
	<textarea
		ref={ref}
		className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm ${className}`}
		{...props}
	/>
));

const Field = ({ label, labelNe, error, required, children }) => (
	<div>
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label}
			{labelNe && (
				<span className="ml-1.5 text-[11px] text-slate-400 font-nepali">
					{labelNe}
				</span>
			)}
			{required && <span className="ml-0.5 text-rose-500">*</span>}
		</label>
		{children}
		{error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
	</div>
);

// Multi-tag input (no forwardRef needed, used with Controller)
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
		<div className="border border-slate-200 rounded-lg p-2 min-h-[42px]">
			<div className="flex flex-wrap gap-1 mb-1">
				{value.map((tag) => (
					<span
						key={tag}
						className="flex items-center gap-1 bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70 text-xs px-2 py-0.5 rounded-full"
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

const Section = ({ title }) => (
	<div className="col-span-full mt-3 mb-0.5 flex items-center gap-2">
		<span className="h-4 w-1 rounded-full bg-brand-500/70" />
		<h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
			{title}
		</h3>
	</div>
);

// ─── Main Form Component ───────────────────────────────────
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
		defaultValues: {
			gender: "MALE",
			allergies: [],
			chronicConditions: [],
		},
	});

	useEffect(() => {
		if (existingPatient) {
			// Ensure arrays are arrays (they might come as strings from API)
			reset({
				...existingPatient,
				dobAD: toDateInputValue(existingPatient.dobAD),
				allergies: existingPatient.allergies || [],
				chronicConditions: existingPatient.chronicConditions || [],
			});
		}
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
			} else {
				toast.error(err.response?.data?.message || "An error occurred");
			}
		},
	});

	const onSubmit = (data) => mutation.mutate(data);

	if (loadingPatient)
		return (
			<div className="page max-w-4xl">
				<div className="space-y-4">
					<div className="skeleton h-8 w-40" />
					<div className="skeleton h-96 rounded-2xl" />
				</div>
			</div>
		);

	return (
		<div className="page max-w-4xl">
			{/* Header */}
			<div className="mb-5 flex items-center gap-3">
				<button
					onClick={() => navigate(-1)}
					aria-label="Back"
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
				>
					<ArrowLeft size={16} />
				</button>
				<div className="min-w-0">
					<h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
						{isEditing ? t("patient.edit") : t("patient.add")}
					</h1>
					<p className="truncate text-[12.5px] text-slate-500">
						{isEditing && existingPatient
							? `${existingPatient.patientCode} · update the patient's details`
							: "Register a new patient · नयाँ बिरामी दर्ता"}
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						{/* Personal Info */}
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
						<Field
							label="Date of Birth (AD) / जन्म मिति"
							error={errors.dobAD?.message}
						>
							<Input type="date" {...register("dobAD")} />
						</Field>

						{/* Contact Info */}
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

						{/* Address */}
						<Section title="Address / ठेगाना" />
						<Field label="Province / प्रदेश" error={errors.province?.message}>
							<Select {...register("province")}>
								<option value="">Select province...</option>
								{[
									"Koshi",
									"Madhesh",
									"Bagmati",
									"Gandaki",
									"Lumbini",
									"Karnali",
									"Sudurpashchim",
								].map((p) => (
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

						{/* Medical History */}
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
								<Textarea
									{...register("notes")}
									rows={3}
									placeholder="Additional notes about the patient..."
								/>
							</Field>
						</div>

						{/* Insurance */}
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

					{/* Form Actions */}
					<div className="mt-6 flex flex-col-reverse items-stretch gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
						>
							{t("common.cancel")}
						</button>
						<button
							type="submit"
							disabled={mutation.isPending || (!isDirty && isEditing)}
							className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Save size={15} />
							{mutation.isPending ? "Saving…" : t("common.save")}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
};

export default PatientForm;
