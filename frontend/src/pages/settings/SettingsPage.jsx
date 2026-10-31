import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import api from "../../api/axios";

const settingsApi = {
	get: () => api.get("/settings"),
	update: (data) => api.put("/settings", data),
};

const Field = ({ label, children }) => (
	<div>
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label}
		</label>
		{children}
	</div>
);

const Input = (props) => (
	<input
		className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
		{...props}
	/>
);

const SettingsPage = () => {
	const queryClient = useQueryClient();

	const { data: settings, isLoading } = useQuery({
		queryKey: ["settings"],
		queryFn: () => settingsApi.get().then((r) => r.data.data),
	});

	const { register, handleSubmit, reset } = useForm();

	useEffect(() => {
		if (settings) {
			const obj = {};
			settings.forEach((s) => {
				obj[s.key] = s.value;
			});
			reset(obj);
		}
	}, [settings, reset]);

	const mutation = useMutation({
		mutationFn: (data) => settingsApi.update(data),
		onSuccess: () => {
			toast.success("Settings saved!");
			queryClient.invalidateQueries(["settings"]);
		},
	});

	if (isLoading)
		return <div className="p-6 text-gray-400">Loading settings...</div>;

	return (
		<div className="page max-w-3xl">
			<PageHeader
				title="Settings"
				description="Clinic profile, billing defaults and preferences · सेटिङ"
			/>

			<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
				<div className="space-y-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
					<div>
						<h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
							Clinic Information
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Clinic Name (English)">
								<Input {...register("clinic_name")} />
							</Field>
							<Field label="Clinic Name (Nepali / नेपाली)">
								<Input
									{...register("clinic_name_ne")}
									className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-nepali"
								/>
							</Field>
							<Field label="Phone">
								<Input {...register("clinic_phone")} />
							</Field>
							<Field label="Email">
								<Input type="email" {...register("clinic_email")} />
							</Field>
							<div className="col-span-full">
								<Field label="Address">
									<Input {...register("clinic_address")} />
								</Field>
							</div>
							<Field label="PAN Number">
								<Input {...register("pan_number")} />
							</Field>
						</div>
					</div>

					<div>
						<h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
							Billing & Finance
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Currency">
								<Input
									{...register("currency")}
									readOnly
									className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-gray-50"
								/>
							</Field>
							<Field label="Tax / VAT (%)">
								<Input
									type="number"
									step="0.01"
									min="0"
									max="100"
									{...register("tax_percent")}
								/>
							</Field>
							<Field label="Default Consultation Fee (NPR)">
								<Input
									type="number"
									min="0"
									{...register("consultation_fee")}
								/>
							</Field>
							<Field label="Invoice Prefix">
								<Input {...register("invoice_prefix")} />
							</Field>
						</div>
					</div>

					<div>
						<h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
							Appointment Settings
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Default Duration (minutes)">
								<Input
									type="number"
									min="5"
									step="5"
									{...register("appointment_duration")}
								/>
							</Field>
							<Field label="Working Hours Start">
								<Input type="time" {...register("working_hours_start")} />
							</Field>
							<Field label="Working Hours End">
								<Input type="time" {...register("working_hours_end")} />
							</Field>
							<Field label="Working Days">
								<Input
									{...register("working_days")}
									placeholder="Sun,Mon,Tue,Wed,Thu,Fri"
								/>
							</Field>
						</div>
					</div>

					<div>
						<h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
							SMS / Notifications
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Enable SMS">
								<select
									{...register("sms_enabled")}
									className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white"
								>
									<option value="false">Disabled</option>
									<option value="true">Enabled</option>
								</select>
							</Field>
						</div>
					</div>

					<div className="flex justify-end border-t border-slate-100 pt-4">
						<button
							type="submit"
							disabled={mutation.isPending}
							className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Save size={15} />
							{mutation.isPending ? "Saving…" : "Save settings"}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
};

export default SettingsPage;
