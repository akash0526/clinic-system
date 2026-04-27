import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Save, Settings } from "lucide-react";
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
		className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
		<div className="p-6 max-w-3xl mx-auto">
			<div className="flex items-center gap-3 mb-6">
				<Settings size={22} className="text-primary-600" />
				<h1 className="text-2xl font-bold text-gray-900">Settings / सेटिङ</h1>
			</div>

			<form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
				<div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
					<div>
						<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
							Clinic Information
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Clinic Name (English)">
								<Input {...register("clinic_name")} />
							</Field>
							<Field label="Clinic Name (Nepali / नेपाली)">
								<Input
									{...register("clinic_name_ne")}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-nepali focus:outline-none focus:ring-2 focus:ring-primary-500"
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
						<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
							Billing & Finance
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Currency">
								<Input
									{...register("currency")}
									readOnly
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
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
						<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
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
						<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
							SMS / Notifications
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Field label="Enable SMS">
								<select
									{...register("sms_enabled")}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
								>
									<option value="false">Disabled</option>
									<option value="true">Enabled</option>
								</select>
							</Field>
						</div>
					</div>

					<div className="pt-4 border-t flex justify-end">
						<button
							type="submit"
							disabled={mutation.isLoading}
							className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
						>
							<Save size={15} />
							{mutation.isLoading ? "Saving..." : "Save Settings"}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
};

export default SettingsPage;
