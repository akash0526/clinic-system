import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, FlaskConical, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { patientsApi } from "../../api/patients.api";

const labApi = {
	tests: () => api.get("/lab/tests"),
	results: (params) => api.get("/lab/results", { params }),
	order: (data) => api.post("/lab/results", data),
	saveResult: (id, d) => api.put(`/lab/results/${id}`, d),
};

const StatusBadge = ({ status }) => {
	const map = {
		PENDING: "bg-yellow-100 text-yellow-700",
		IN_PROGRESS: "bg-blue-100 text-blue-700",
		COMPLETED: "bg-green-100 text-green-700",
		CANCELLED: "bg-red-100 text-red-600",
	};
	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status]}`}
		>
			{status}
		</span>
	);
};

// ─── Enter Result Modal ───────────────────────────────────
const ResultModal = ({ result, onClose }) => {
	const queryClient = useQueryClient();
	const [value, setValue] = useState("");
	const [interpretation, setInterpretation] = useState("");
	const [notes, setNotes] = useState("");

	const mutation = useMutation({
		mutationFn: () =>
			labApi.saveResult(result.id, {
				resultData: {
					value,
					unit: result.test?.unit,
					normalRange: result.test?.normalRange,
				},
				interpretation,
				notes,
				status: "COMPLETED",
			}),
		onSuccess: () => {
			toast.success("Result saved!");
			queryClient.invalidateQueries(["lab-results"]);
			onClose();
		},
	});

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
				<h3 className="text-lg font-semibold mb-1">Enter Lab Result</h3>
				<p className="text-sm text-gray-500 mb-1">{result.test?.testName}</p>
				<p className="text-xs text-gray-400 mb-4">
					Patient: {result.patient?.fullName} · Normal:{" "}
					{result.test?.normalRange} {result.test?.unit}
				</p>

				<div className="space-y-3">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Result Value {result.test?.unit && `(${result.test.unit})`}
						</label>
						<input
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder={`Normal: ${result.test?.normalRange}`}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Interpretation
						</label>
						<select
							value={interpretation}
							onChange={(e) => setInterpretation(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="">Select...</option>
							<option value="NORMAL">Normal</option>
							<option value="ABNORMAL_HIGH">Abnormal - High</option>
							<option value="ABNORMAL_LOW">Abnormal - Low</option>
							<option value="CRITICAL">Critical</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Notes
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={2}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
				</div>

				<div className="flex gap-3 mt-5">
					<button
						onClick={onClose}
						className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						onClick={() => mutation.mutate()}
						disabled={!value || mutation.isLoading}
						className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
					>
						Save Result
					</button>
				</div>
			</div>
		</div>
	);
};

// ─── Order Test Modal ──────────────────────────────────────
const OrderModal = ({ onClose }) => {
	const queryClient = useQueryClient();
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [selectedTest, setSelectedTest] = useState("");

	const { data: tests = [] } = useQuery({
		queryKey: ["lab-tests"],
		queryFn: () => labApi.tests().then((r) => r.data.data),
	});

	const { data: patients } = useQuery({
		queryKey: ["patient-search-lab", patientSearch],
		queryFn: () =>
			patientsApi
				.list({ search: patientSearch, limit: 5 })
				.then((r) => r.data.data),
		enabled: patientSearch.length > 1,
	});

	const mutation = useMutation({
		mutationFn: () =>
			labApi.order({ patientId: selectedPatient.id, testId: selectedTest }),
		onSuccess: () => {
			toast.success("Lab test ordered!");
			queryClient.invalidateQueries(["lab-results"]);
			onClose();
		},
	});

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
				<h3 className="text-lg font-semibold mb-4">Order Lab Test</h3>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Patient *
						</label>
						{selectedPatient ? (
							<div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
								<p className="text-sm font-medium">
									{selectedPatient.fullName}
								</p>
								<button
									onClick={() => setSelectedPatient(null)}
									className="text-xs text-red-500"
								>
									Change
								</button>
							</div>
						) : (
							<div className="relative">
								<input
									value={patientSearch}
									onChange={(e) => setPatientSearch(e.target.value)}
									placeholder="Search patient..."
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
								{patients?.length > 0 && (
									<div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
										{patients.map((p) => (
											<button
												key={p.id}
												onClick={() => {
													setSelectedPatient(p);
													setPatientSearch("");
												}}
												className="flex flex-col w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b last:border-0"
											>
												<span className="font-medium">{p.fullName}</span>
												<span className="text-xs text-gray-400">
													{p.patientCode}
												</span>
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Lab Test *
						</label>
						<select
							value={selectedTest}
							onChange={(e) => setSelectedTest(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="">Select test...</option>
							{tests.map((t) => (
								<option key={t.id} value={t.id}>
									{t.testName} ({t.testCode}) — NPR{" "}
									{Number(t.price).toLocaleString()}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="flex gap-3 mt-5">
					<button
						onClick={onClose}
						className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						onClick={() => mutation.mutate()}
						disabled={!selectedPatient || !selectedTest || mutation.isLoading}
						className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
					>
						Order Test
					</button>
				</div>
			</div>
		</div>
	);
};

// ─── Main ─────────────────────────────────────────────────
const LabPage = () => {
	const [showOrder, setShowOrder] = useState(false);
	const [enterResult, setEnterResult] = useState(null);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");

	const { data, isLoading } = useQuery({
		queryKey: ["lab-results", search, statusFilter],
		queryFn: () =>
			labApi.results({ search, status: statusFilter }).then((r) => r.data),
	});

	return (
		<div className="p-6 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-gray-900">
					Laboratory / प्रयोगशाला
				</h1>
				<button
					onClick={() => setShowOrder(true)}
					className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
				>
					<Plus size={16} /> Order Test
				</button>
			</div>

			<div className="bg-white rounded-xl border border-gray-200">
				<div className="flex flex-wrap gap-3 p-4 border-b">
					<div className="relative flex-1 min-w-48">
						<Search
							size={15}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search patient..."
							className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
					<div className="flex gap-2">
						{["", "PENDING", "IN_PROGRESS", "COMPLETED"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`px-3 py-1.5 text-xs rounded-full font-medium border transition-colors
                  ${statusFilter === s ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"}`}
							>
								{s || "All"}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b">
							<tr>
								{[
									"Patient",
									"Test",
									"Category",
									"Ordered At",
									"Status",
									"Result",
									"Actions",
								].map((h) => (
									<th
										key={h}
										className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{isLoading && (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-10 text-center text-gray-400"
									>
										Loading...
									</td>
								</tr>
							)}
							{data?.data?.map((r) => (
								<tr key={r.id} className="hover:bg-gray-50">
									<td className="px-4 py-3">
										<p className="font-medium">{r.patient?.fullName}</p>
										<p className="text-xs text-gray-400">
											{r.patient?.patientCode}
										</p>
									</td>
									<td className="px-4 py-3">
										<p className="font-medium">{r.test?.testName}</p>
										<p className="text-xs text-gray-400">{r.test?.testCode}</p>
									</td>
									<td className="px-4 py-3 text-gray-500">
										{r.test?.category}
									</td>
									<td className="px-4 py-3 text-gray-500 text-xs">
										{new Date(r.orderedAt).toLocaleString("en-NP")}
									</td>
									<td className="px-4 py-3">
										<StatusBadge status={r.status} />
									</td>
									<td className="px-4 py-3 text-gray-700">
										{r.resultData?.value ? (
											<span
												className={`font-medium ${r.interpretation === "NORMAL" ? "text-green-600" : "text-red-600"}`}
											>
												{r.resultData.value} {r.resultData.unit}
											</span>
										) : (
											"—"
										)}
									</td>
									<td className="px-4 py-3">
										{r.status !== "COMPLETED" && (
											<button
												onClick={() => setEnterResult(r)}
												className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded font-medium"
											>
												<CheckCircle size={12} /> Enter Result
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{showOrder && <OrderModal onClose={() => setShowOrder(false)} />}
			{enterResult && (
				<ResultModal
					result={enterResult}
					onClose={() => setEnterResult(null)}
				/>
			)}
		</div>
	);
};

export default LabPage;
