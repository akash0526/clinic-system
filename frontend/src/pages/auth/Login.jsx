import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";

const schema = z.object({
	email: z.string().email("Valid email required"),
	password: z.string().min(1, "Password required"),
});

const Login = () => {
	const navigate = useNavigate();
	const { login } = useAuthStore();
	const [showPass, setShowPass] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(schema),
	});

	const onSubmit = async (data) => {
		try {
			await login(data.email, data.password);
			navigate("/dashboard");
		} catch (err) {
			toast.error(err.response?.data?.message || "Login failed");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
						<Stethoscope size={32} className="text-white" />
					</div>
					<h1 className="text-2xl font-bold text-white">Clinic Management</h1>
					<p className="text-primary-200 text-sm mt-1 font-nepali">
						क्लिनिक व्यवस्थापन प्रणाली
					</p>
				</div>

				{/* Card */}
				<div className="bg-white rounded-2xl shadow-2xl p-8">
					<h2 className="text-xl font-semibold text-gray-800 mb-6">
						Sign in to your account
					</h2>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email Address
							</label>
							<input
								{...register("email")}
								type="email"
								autoComplete="email"
								placeholder="you@clinic.com"
								className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
							{errors.email && (
								<p className="mt-1 text-xs text-red-500">
									{errors.email.message}
								</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Password
							</label>
							<div className="relative">
								<input
									{...register("password")}
									type={showPass ? "text" : "password"}
									autoComplete="current-password"
									placeholder="••••••••"
									className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
								<button
									type="button"
									onClick={() => setShowPass((v) => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									{showPass ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
							{errors.password && (
								<p className="mt-1 text-xs text-red-500">
									{errors.password.message}
								</p>
							)}
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
						>
							{isSubmitting ? "Signing in..." : "Sign In"}
						</button>
					</form>

					<div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
						<p className="font-medium text-gray-600 mb-2">Demo Credentials:</p>
						<p>Admin: admin@clinic.com / Admin@12345</p>
						<p>Doctor: doctor@clinic.com / Doctor@12345</p>
						<p>Reception: reception@clinic.com / Staff@12345</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
