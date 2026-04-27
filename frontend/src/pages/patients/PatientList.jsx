import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Eye, Edit2, UserX } from "lucide-react";
import { patientsApi } from "../../api/patients.api";
import useAuthStore from "../../store/authStore";

// ─── Subcomponents ────────────────────────────────────────

const GenderBadge = ({ gender }) => {
	const colors = {
		MALE: "bg-blue-100 text-blue-700",
		FEMALE: "bg-pink-100 text-pink-700",
		OTHER: "bg-gray-100 text-gray-700",
	};
	const labels = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
	return (
		<span
			className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[gender]}`}
		>
			{labels[gender]}
		</span>
	);
};

const Pagination = ({ meta, page, setPage }) => {
	if (!meta || meta.totalPages <= 1) return null;
	return (
		<div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
			<p className="text-sm text-gray-600">
				Showing {(page - 1) * meta.limit + 1}–
				{Math.min(page * meta.limit, meta.total)} of {meta.total}
			</p>
			<div className="flex gap-2">
				<button
					onClick={() => setPage((p) => p - 1)}
					disabled={!meta.hasPrev}
					className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50"
				>
					Previous
				</button>
				<span className="px-3 py-1 text-sm text-gray-700">
					Page {page} of {meta.totalPages}
				</span>
				<button
					onClick={() => setPage((p) => p + 1)}
					disabled={!meta.hasNext}
					className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50"
				>
					Next
				</button>
			</div>
		</div>
	);
};

// ─── Main Component ───────────────────────────────────────

const PatientList = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user } = useAuthStore();

	const [search, setSearch] = useState("");
	const [gender, setGender] = useState("");
	const [page, setPage] = useState(1);
	const [searchInput, setSearchInput] = useState("");

	const { data, isLoading, error } = useQuery({
		queryKey: ["patients", { search, gender, page }],
		queryFn: () =>
			patientsApi.list({ search, gender, page, limit: 20 }).then((r) => r.data),
		keepPreviousData: true,
	});

	const handleSearch = (e) => {
		e.preventDefault();
		setSearch(searchInput);
		setPage(1);
	};

	const handleGenderFilter = (val) => {
		setGender(val === gender ? "" : val);
		setPage(1);
	};

	return (
		<div className="p-6 max-w-7xl mx-auto">
			{/* ── Header ─────────────────────────────────────── */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						{t("patient.title")}
					</h1>
					<p className="text-sm text-gray-500 mt-1">
						{data?.meta?.total ?? 0} registered patients
					</p>
				</div>
				<Link
					to="/patients/new"
					className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
				>
					<Plus size={16} />
					{t("patient.add")}
				</Link>
			</div>

			{/* ── Search & Filters ────────────────────────────── */}
			<div className="bg-white rounded-xl border border-gray-200 mb-4">
				<div className="p-4 flex flex-wrap gap-3 items-center">
					{/* Search bar */}
					<form onSubmit={handleSearch} className="flex flex-1 min-w-64 gap-2">
						<div className="relative flex-1">
							<Search
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
							/>
							<input
								type="text"
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder={t("patient.search")}
								className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
						</div>
						<button
							type="submit"
							className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
						>
							{t("common.search")}
						</button>
					</form>

					{/* Gender filter pills */}
					<div className="flex gap-2">
						{["MALE", "FEMALE", "OTHER"].map((g) => (
							<button
								key={g}
								onClick={() => handleGenderFilter(g)}
								className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${
										gender === g
											? "bg-primary-600 text-white border-primary-600"
											: "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
									}`}
							>
								{g.charAt(0) + g.slice(1).toLowerCase()}
							</button>
						))}
					</div>
				</div>

				{/* ── Table ──────────────────────────────────────── */}
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-y border-gray-200">
							<tr>
								{[
									"Patient Code",
									"Name / नाम",
									"Gender",
									"DOB (BS)",
									"Phone",
									"District",
									"Actions",
								].map((h) => (
									<th
										key={h}
										className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
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
										className="px-4 py-12 text-center text-gray-400"
									>
										{t("common.loading")}
									</td>
								</tr>
							)}
							{error && (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-12 text-center text-red-500"
									>
										Error loading patients
									</td>
								</tr>
							)}
							{!isLoading && data?.data?.length === 0 && (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-12 text-center text-gray-400"
									>
										{t("common.noData")}
									</td>
								</tr>
							)}
							{data?.data?.map((patient) => (
								<tr
									key={patient.id}
									className="hover:bg-gray-50 transition-colors"
								>
									<td className="px-4 py-3">
										<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
											{patient.patientCode}
										</span>
									</td>
									<td className="px-4 py-3">
										<div className="font-medium text-gray-900">
											{patient.fullName}
										</div>
										{patient.fullNameNe && (
											<div className="text-xs text-gray-500 font-nepali">
												{patient.fullNameNe}
											</div>
										)}
									</td>
									<td className="px-4 py-3">
										<GenderBadge gender={patient.gender} />
									</td>
									<td className="px-4 py-3 text-gray-600">
										{patient.dobBS || "—"}
									</td>
									<td className="px-4 py-3 text-gray-600">
										{patient.phone || "—"}
									</td>
									<td className="px-4 py-3 text-gray-600">
										{patient.district || "—"}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<button
												onClick={() => navigate(`/patients/${patient.id}`)}
												className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
												title="View"
											>
												<Eye size={15} />
											</button>
											<button
												onClick={() => navigate(`/patients/${patient.id}/edit`)}
												className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
												title="Edit"
											>
												<Edit2 size={15} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<Pagination meta={data?.meta} page={page} setPage={setPage} />
			</div>
		</div>
	);
};

export default PatientList;
