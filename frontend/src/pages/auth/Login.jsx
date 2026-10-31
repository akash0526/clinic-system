import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Eye,
	EyeOff,
	Stethoscope,
	Mail,
	Lock,
	ArrowRight,
	CheckCircle2,
	ChevronDown,
	CalendarCheck,
	ShieldCheck,
	ReceiptText,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import { cn } from "../../utils/cn";

const schema = z.object({
	email: z.string().email("Enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

const DEMO_ACCOUNTS = [
	{ role: "Admin", email: "admin@clinic.com", password: "Admin@12345" },
	{ role: "Doctor", email: "doctor1@clinic.com", password: "Doctor@12345" },
	{ role: "Reception", email: "reception@clinic.com", password: "Staff@12345" },
	{ role: "Lab Tech", email: "labtech@clinic.com", password: "Lab@12345" },
];

const HIGHLIGHTS = [
	{ icon: CalendarCheck, text: "Appointments, tokens and queues in one view" },
	{ icon: ReceiptText, text: "Billing and receipts in a couple of clicks" },
	{ icon: ShieldCheck, text: "Role-based access for every staff member" },
];

const Login = () => {
	const navigate = useNavigate();
	const { login } = useAuthStore();
	const [showPass, setShowPass] = useState(false);
	const [showDemo, setShowDemo] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

	const onSubmit = async (data) => {
		try {
			await login(data.email, data.password);
			toast.success("Welcome back!");
			navigate("/dashboard");
		} catch (err) {
			toast.error(err.response?.data?.message || "Unable to sign in. Check your details.");
		}
	};

	const fillDemo = (account) => {
		setValue("email", account.email, { shouldValidate: true });
		setValue("password", account.password, { shouldValidate: true });
	};

	return (
		<div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
			{/* ── Brand panel ─────────────────────────────── */}
			<div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-900 to-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
				{/* ambient shapes */}
				<div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" />
				<div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
				<div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px]" />

				<div className="relative flex items-center gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-inset ring-white/20 backdrop-blur">
						<Stethoscope size={20} />
					</span>
					<div>
						<p className="text-[15px] font-semibold leading-tight text-white">Clinic MS</p>
						<p className="text-[11px] leading-tight text-brand-100/70 font-nepali">
							क्लिनिक व्यवस्थापन प्रणाली
						</p>
					</div>
				</div>

				<div className="relative max-w-md">
					<h1 className="text-[34px] font-semibold leading-[1.15] tracking-tight text-white">
						Care, simplified.
					</h1>
					<p className="mt-4 text-[15px] leading-relaxed text-brand-100/80">
						Run your clinic without the paperwork — patients, visits, bills and
						lab results, all in one calm place.
					</p>

					<ul className="mt-9 space-y-3.5">
						{HIGHLIGHTS.map(({ icon: Icon, text }) => (
							<li key={text} className="flex items-start gap-3">
								<span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-200 ring-1 ring-inset ring-white/10">
									<Icon size={15} />
								</span>
								<span className="text-sm leading-relaxed text-brand-50/90">{text}</span>
							</li>
						))}
					</ul>
				</div>

				<p className="relative text-xs text-brand-100/50">
					Built for small clinics in Nepal · AD dates supported
				</p>
			</div>

			{/* ── Form panel ──────────────────────────────── */}
			<div className="flex items-center justify-center px-5 py-10 sm:px-10">
				<div className="w-full max-w-[400px] animate-fade-in-up">
					{/* Mobile brand */}
					<div className="mb-8 flex items-center gap-3 lg:hidden">
						<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/25">
							<Stethoscope size={19} />
						</span>
						<div>
							<p className="text-[15px] font-semibold leading-tight text-slate-900">
								Clinic MS
							</p>
							<p className="text-[11px] leading-tight text-slate-400 font-nepali">
								क्लिनिक व्यवस्थापन प्रणाली
							</p>
						</div>
					</div>

					<div className="mb-7">
						<h2 className="text-[26px] font-semibold tracking-tight text-slate-900">
							Welcome back
						</h2>
						<p className="mt-1.5 text-sm text-slate-500">
							Sign in to continue to your clinic workspace.
						</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
						<div>
							<label htmlFor="email" className="label">
								Email address
							</label>
							<div className="relative">
								<Mail
									size={16}
									className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
								/>
								<input
									id="email"
									{...register("email")}
									type="email"
									autoComplete="email"
									placeholder="you@clinic.com"
									className={cn(
										"h-11 w-full pl-10",
										errors.email && "border-rose-300 focus:border-rose-400",
									)}
								/>
							</div>
							{errors.email && <p className="error-text">{errors.email.message}</p>}
						</div>

						<div>
							<label htmlFor="password" className="label">
								Password
							</label>
							<div className="relative">
								<Lock
									size={16}
									className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
								/>
								<input
									id="password"
									{...register("password")}
									type={showPass ? "text" : "password"}
									autoComplete="current-password"
									placeholder="••••••••"
									className={cn(
										"h-11 w-full pl-10 pr-11",
										errors.password && "border-rose-300 focus:border-rose-400",
									)}
								/>
								<button
									type="button"
									onClick={() => setShowPass((v) => !v)}
									className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
									aria-label={showPass ? "Hide password" : "Show password"}
								>
									{showPass ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
							{errors.password && <p className="error-text">{errors.password.message}</p>}
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60"
						>
							{isSubmitting ? (
								<>
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
									Signing in…
								</>
							) : (
								<>
									Sign in
									<ArrowRight size={16} />
								</>
							)}
						</button>
					</form>

					{/* Demo accounts */}
					<div className="mt-7 rounded-xl border border-slate-200/80 bg-slate-50/60">
						<button
							onClick={() => setShowDemo((v) => !v)}
							className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
							aria-expanded={showDemo}
						>
							<span className="text-xs font-medium text-slate-600">
								Try a demo account
							</span>
							<ChevronDown
								size={15}
								className={cn(
									"text-slate-400 transition-transform duration-200",
									showDemo && "rotate-180",
								)}
							/>
						</button>

						{showDemo && (
							<div className="animate-fade-in border-t border-slate-200/70 p-3">
								<div className="grid grid-cols-2 gap-2">
									{DEMO_ACCOUNTS.map((account) => (
										<button
											key={account.role}
											type="button"
											onClick={() => fillDemo(account)}
											className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
										>
											<CheckCircle2 size={13} className="text-slate-300" />
											{account.role}
										</button>
									))}
								</div>
								<p className="mt-2.5 px-1 text-[11px] leading-relaxed text-slate-400">
									Click a role to auto-fill its credentials, then press Sign in.
								</p>
							</div>
						)}
					</div>

					<p className="mt-8 text-center text-[11px] text-slate-400">
						© {new Date().getFullYear()} Clinic MS · Secure staff access
					</p>
				</div>
			</div>
		</div>
	);
};

export default Login;
