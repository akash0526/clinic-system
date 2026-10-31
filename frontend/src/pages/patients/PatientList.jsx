import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Eye, Pencil, Users } from "lucide-react";
import { patientsApi } from "../../api/patients.api";
import { formatDate, calculateAge } from "../../utils/date";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import Pagination from "../../components/ui/Pagination";
import EmptyState from "../../components/ui/EmptyState";
import { SearchInput } from "../../components/ui/Input";
import {
	TableWrap,
	THead,
	TH,
	TBody,
	TR,
	TD,
	TableState,
} from "../../components/ui/Table";
import { cn } from "../../utils/cn";

const GENDER_TONE = { MALE: "blue", FEMALE: "pink", OTHER: "neutral" };

const PatientList = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	const [gender, setGender] = useState("");
	const [page, setPage] = useState(1);
	const [searchInput, setSearchInput] = useState("");

	// Debounced live search — no submit button needed.
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearch(searchInput.trim());
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const { data, isLoading, isFetching, error } = useQuery({
		queryKey: ["patients", { search, gender, page }],
		queryFn: () =>
			patientsApi.list({ search, gender, page, limit: 20 }).then((r) => r.data),
		keepPreviousData: true,
	});

	const rows = data?.data ?? [];
	const hasFilters = Boolean(search || gender);

	return (
		<div className="page">
			<PageHeader
				title={t("patient.title")}
				description={`${data?.meta?.total ?? 0} registered ${
					data?.meta?.total === 1 ? "patient" : "patients"
				}`}
				actions={
					<Button as={Link} to="/patients/new" icon={Plus}>
						{t("patient.add")}
					</Button>
				}
			/>

			<Card className="overflow-hidden">
				{/* Toolbar */}
				<div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
					<SearchInput
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder={t("patient.search")}
						className="w-full sm:max-w-xs"
					/>

					<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
						{["", "MALE", "FEMALE", "OTHER"].map((g) => {
							const active = gender === g;
							const label = g ? t(`patient.${g.toLowerCase()}`) : "All";
							return (
								<button
									key={g || "all"}
									onClick={() => {
										setGender(g);
										setPage(1);
									}}
									className={cn(
										"h-8 whitespace-nowrap rounded-full px-3 text-xs font-medium ring-1 ring-inset transition",
										active
											? "bg-slate-900 text-white ring-slate-900"
											: "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900",
									)}
								>
									{label}
								</button>
							);
						})}
					</div>
				</div>

				<TableWrap>
					<THead>
						<tr>
							<TH>Patient</TH>
							<TH className="hidden md:table-cell">Code</TH>
							<TH className="hidden sm:table-cell">Gender</TH>
							<TH className="hidden lg:table-cell">Age / DOB</TH>
							<TH className="hidden md:table-cell">Phone</TH>
							<TH className="hidden xl:table-cell">District</TH>
							<TH className="text-right">Actions</TH>
						</tr>
					</THead>
					<TBody className={cn(isFetching && "opacity-60 transition-opacity")}>
						{isLoading && <TableState loading />}

						{!isLoading && error && (
							<TableState
								icon={Users}
								title="Could not load patients"
								description="Please check your connection and try again."
							/>
						)}

						{!isLoading && !error && rows.length === 0 && (
							<tr>
								<td colSpan={7}>
									<EmptyState
										icon={Users}
										title={hasFilters ? "No matching patients" : t("common.noData")}
										description={
											hasFilters
												? "Try a different search term or clear the filters."
												: "Patient records will appear here once they are registered."
										}
										action={
											hasFilters ? (
												<Button
													size="sm"
													variant="secondary"
													onClick={() => {
														setSearchInput("");
														setGender("");
													}}
												>
													Clear filters
												</Button>
											) : (
												<Button
													as={Link}
													to="/patients/new"
													size="sm"
													icon={Plus}
												>
													{t("patient.add")}
												</Button>
											)
										}
									/>
								</td>
							</tr>
						)}

						{rows.map((patient) => (
							<TR
								key={patient.id}
								className="cursor-pointer"
								onClick={() => navigate(`/patients/${patient.id}`)}
							>
								<TD>
									<div className="flex items-center gap-3">
										<Avatar name={patient.fullName} size="sm" />
										<div className="min-w-0">
											<p className="truncate text-[13.5px] font-medium text-slate-900">
												{patient.fullName}
											</p>
											{patient.fullNameNe && (
												<p className="truncate text-[11.5px] text-slate-400 font-nepali">
													{patient.fullNameNe}
												</p>
											)}
										</div>
									</div>
								</TD>
								<TD className="hidden md:table-cell">
									<span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
										{patient.patientCode}
									</span>
								</TD>
								<TD className="hidden sm:table-cell">
									<Badge tone={GENDER_TONE[patient.gender]} size="sm">
										{t(`patient.${String(patient.gender).toLowerCase()}`)}
									</Badge>
								</TD>
								<TD className="hidden lg:table-cell">
									<p className="text-[13px] text-slate-700">
										{patient.dobAD && calculateAge(patient.dobAD) != null
											? `${calculateAge(patient.dobAD)} yrs`
											: "—"}
									</p>
									<p className="text-[11px] text-slate-400">
										{patient.dobAD ? formatDate(patient.dobAD) : "No DOB"}
									</p>
								</TD>
								<TD className="hidden md:table-cell">
									<p className="text-[13px] text-slate-700">
										{patient.phone || "—"}
									</p>
								</TD>
								<TD className="hidden xl:table-cell">
									<p className="text-[13px] text-slate-700">
										{patient.district || "—"}
									</p>
								</TD>
								<TD className="text-right">
									<div className="flex items-center justify-end gap-1">
										<button
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/patients/${patient.id}`);
											}}
											className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
											title="View patient"
											aria-label={`View ${patient.fullName}`}
										>
											<Eye size={16} />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/patients/${patient.id}/edit`);
											}}
											className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
											title="Edit patient"
											aria-label={`Edit ${patient.fullName}`}
										>
											<Pencil size={15} />
										</button>
									</div>
								</TD>
							</TR>
						))}
					</TBody>
				</TableWrap>

				<Pagination meta={data?.meta} page={page} setPage={setPage} />
			</Card>
		</div>
	);
};

export default PatientList;
