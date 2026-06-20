import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Printer, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { billingApi } from "../../api/billing.api";
import { patientsApi } from "../../api/patients.api";
import { formatDate } from "../../utils/date";
import { printInvoice } from "../../utils/printInvoice";

const BILL_ITEMS_DEFAULTS = [
	{
		description: "Consultation Fee",
		category: "CONSULTATION",
		quantity: 1,
		unitPrice: 500,
	},
];

const StatusBadge = ({ status }) => {
	const map = {
		PAID: "bg-green-100 text-green-700",
		PENDING: "bg-yellow-100 text-yellow-700",
		PARTIAL: "bg-blue-100 text-blue-700",
		CANCELLED: "bg-red-100 text-red-600",
		DRAFT: "bg-gray-100 text-gray-600",
	};
	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full font-medium ${
				map[status] || "bg-gray-100"
			}`}
		>
			{status}
		</span>
	);
};

// ─── Inventory item picker (auto-fills price + name, no stock deduction) ──
// Searchable picker that merges INVENTORY items + LAB tests into one dropdown.
// Auto-fills description, unitPrice, category. Does NOT touch stock.
const ItemPicker = ({ value, onPick }) => {
	const [open, setOpen] = useState(false);
	const [term, setTerm] = useState("");
	const [results, setResults] = useState([]);

	useEffect(() => {
		if (term.length < 2) {
			setResults([]);
			return;
		}
		let active = true;
		const t = setTimeout(async () => {
			try {
				const [invRes, labRes] = await Promise.all([
					billingApi
						.searchInventory(term)
						.catch(() => ({ data: { data: [] } })),
					billingApi.searchLabTests().catch(() => ({ data: { data: [] } })),
				]);

				// Normalize inventory items
				const inv = (invRes.data.data || []).map((it) => ({
					key: `inv-${it.id}`,
					name: it.name,
					price: Number(it.sellingPrice),
					category: it.category === "MEDICINE" ? "MEDICINE" : "OTHER",
					meta: `${it.itemCode} · stock: ${it.currentStock} ${it.unit}`,
					kind: "INVENTORY",
				}));

				// Normalize lab tests + filter by the search term on the frontend
				const lab = (labRes.data.data || [])
					.filter((t) => t.testName.toLowerCase().includes(term.toLowerCase()))
					.map((t) => ({
						key: `lab-${t.id}`,
						name: t.testName,
						price: Number(t.price),
						category: "LAB",
						meta: `Lab · ${t.testCode}`,
						kind: "LAB",
					}));

				if (active) setResults([...lab, ...inv]);
			} catch {
				if (active) setResults([]);
			}
		}, 250);
		return () => {
			active = false;
			clearTimeout(t);
		};
	}, [term]);

	return (
		<div className="relative">
			<input
				value={open ? term : value}
				onChange={(e) => {
					setTerm(e.target.value);
					setOpen(true);
				}}
				onFocus={() => {
					setOpen(true);
					setTerm("");
				}}
				onBlur={() => setTimeout(() => setOpen(false), 150)}
				placeholder="Type item / lab test / free text..."
				className="w-full border-0 focus:outline-none text-sm"
			/>
			{open && results.length > 0 && (
				<div className="absolute top-full left-0 z-20 mt-1 w-72 max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
					{results.map((it) => (
						<button
							key={it.key}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								onPick(it);
								setOpen(false);
							}}
							className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b last:border-0"
						>
							<span className="flex flex-col">
								<span className="font-medium">
									{it.kind === "LAB" && (
										<span className="text-purple-600 text-xs mr-1">[Lab]</span>
									)}
									{it.name}
								</span>
								<span className="text-xs text-gray-400">{it.meta}</span>
							</span>
							<span className="text-xs font-medium text-primary-600">
								NPR {it.price.toLocaleString()}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

// ─── New Bill Modal ────────────────────────────────────────
const NewBillModal = ({ onClose }) => {
	const queryClient = useQueryClient();
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [items, setItems] = useState(
		BILL_ITEMS_DEFAULTS.map((i) => ({ ...i })),
	);
	const [discount, setDiscount] = useState({ type: "FIXED", value: 0 });
	const [paidAmount, setPaidAmount] = useState(0);
	const [paymentMethod, setPaymentMethod] = useState("CASH");
	const [notes, setNotes] = useState("");

	const { data: patients } = useQuery({
		queryKey: ["patient-search-bill", patientSearch],
		queryFn: () =>
			patientsApi
				.list({ search: patientSearch, limit: 5 })
				.then((r) => r.data.data),
		enabled: patientSearch.length > 1,
	});

	const subtotal = items.reduce(
		(s, i) => s + Number(i.quantity) * Number(i.unitPrice),
		0,
	);
	const discountAmt =
		discount.type === "PERCENT"
			? subtotal * (discount.value / 100)
			: Number(discount.value);
	const total = Math.max(0, subtotal - discountAmt);
	const due = Math.max(0, total - Number(paidAmount));

	const updateItem = (idx, field, val) => {
		setItems((prev) =>
			prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item)),
		);
	};

	const addItem = () =>
		setItems((prev) => [
			...prev,
			{ description: "", category: "OTHER", quantity: 1, unitPrice: 0 },
		]);
	const removeItem = (idx) =>
		setItems((prev) => prev.filter((_, i) => i !== idx));

	const mutation = useMutation({
		mutationFn: () =>
			billingApi.create({
				patientId: selectedPatient.id,
				items,
				discountType: discount.type,
				discountValue: discount.value,
				paidAmount: Number(paidAmount),
				paymentMethod,
				notes,
			}),
		onSuccess: (res) => {
			toast.success(`Bill ${res.data.data.billNumber} created!`);
			queryClient.invalidateQueries(["bills"]);
			onClose();
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Failed to create bill");
		},
	});

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
			<div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-6">
				<div className="flex items-center justify-between p-5 border-b">
					<h2 className="text-lg font-semibold">New Bill / नयाँ बिल</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-xl"
					>
						×
					</button>
				</div>

				<div className="p-5 space-y-4">
					{/* Patient */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Patient *
						</label>
						{selectedPatient ? (
							<div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
								<div>
									<p className="text-sm font-medium">
										{selectedPatient.fullName}
									</p>
									<p className="text-xs text-gray-500">
										{selectedPatient.patientCode}
									</p>
								</div>
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

					{/* Bill Items */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="text-sm font-medium text-gray-700">
								Bill Items
							</label>
							<button
								onClick={addItem}
								className="text-xs text-primary-600 hover:underline flex items-center gap-1"
							>
								<Plus size={12} /> Add Item
							</button>
						</div>
						<div className="border border-gray-200 rounded-lg overflow-visible">
							<table className="w-full text-sm">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-3 py-2 text-left text-xs text-gray-500">
											Description
										</th>
										<th className="px-3 py-2 text-left text-xs text-gray-500">
											Category
										</th>
										<th className="px-3 py-2 text-left text-xs text-gray-500">
											Qty
										</th>
										<th className="px-3 py-2 text-left text-xs text-gray-500">
											Unit Price
										</th>
										<th className="px-3 py-2 text-left text-xs text-gray-500">
											Total
										</th>
										<th className="px-3 py-2"></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{items.map((item, idx) => (
										<tr key={idx}>
											<td className="px-2 py-1.5">
												<ItemPicker
													value={item.description}
													onPick={(it) => {
														updateItem(idx, "description", it.name);
														updateItem(idx, "unitPrice", it.price);
														updateItem(idx, "category", it.category);
													}}
												/>
											</td>
											<td className="px-2 py-1.5">
												<select
													value={item.category}
													onChange={(e) =>
														updateItem(idx, "category", e.target.value)
													}
													className="text-xs border-0 focus:outline-none bg-transparent"
												>
													{[
														"CONSULTATION",
														"LAB",
														"MEDICINE",
														"PROCEDURE",
														"OTHER",
													].map((c) => (
														<option key={c} value={c}>
															{c}
														</option>
													))}
												</select>
											</td>
											<td className="px-2 py-1.5 w-16">
												<input
													type="number"
													min="1"
													value={item.quantity}
													onChange={(e) =>
														updateItem(idx, "quantity", e.target.value)
													}
													className="w-full border-0 focus:outline-none text-sm text-center"
												/>
											</td>
											<td className="px-2 py-1.5 w-24">
												<input
													type="number"
													min="0"
													value={item.unitPrice}
													onChange={(e) =>
														updateItem(idx, "unitPrice", e.target.value)
													}
													className="w-full border-0 focus:outline-none text-sm text-right"
												/>
											</td>
											<td className="px-2 py-1.5 text-right text-gray-700 font-medium">
												{(
													Number(item.quantity) * Number(item.unitPrice)
												).toLocaleString()}
											</td>
											<td className="px-2 py-1.5">
												<button
													onClick={() => removeItem(idx)}
													className="text-gray-300 hover:text-red-500"
												>
													×
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Totals */}
					<div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-600">Subtotal</span>
							<span className="font-medium">
								NPR {subtotal.toLocaleString()}
							</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span className="text-gray-600">Discount</span>
							<div className="flex items-center gap-2">
								<select
									value={discount.type}
									onChange={(e) =>
										setDiscount((d) => ({ ...d, type: e.target.value }))
									}
									className="text-xs border border-gray-300 rounded px-1 py-0.5"
								>
									<option value="FIXED">NPR</option>
									<option value="PERCENT">%</option>
								</select>
								<input
									type="number"
									min="0"
									value={discount.value}
									onChange={(e) =>
										setDiscount((d) => ({ ...d, value: e.target.value }))
									}
									className="w-20 border border-gray-300 rounded px-2 py-0.5 text-sm text-right"
								/>
								<span className="text-gray-500">
									= NPR {discountAmt.toFixed(0)}
								</span>
							</div>
						</div>
						<div className="flex justify-between text-base font-bold border-t pt-2">
							<span>Total</span>
							<span className="text-primary-700">
								NPR {total.toLocaleString()}
							</span>
						</div>
					</div>

					{/* Payment */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Payment Method
							</label>
							<select
								value={paymentMethod}
								onChange={(e) => setPaymentMethod(e.target.value)}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
							>
								{["CASH", "ESEWA", "KHALTI", "BANK_TRANSFER", "INSURANCE"].map(
									(m) => (
										<option key={m} value={m}>
											{m}
										</option>
									),
								)}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Amount Paid (NPR)
							</label>
							<input
								type="number"
								min="0"
								max={total}
								value={paidAmount}
								onChange={(e) => setPaidAmount(e.target.value)}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
						</div>
					</div>

					{due > 0 && (
						<div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
							<span className="text-amber-700">Amount Due</span>
							<span className="font-bold text-amber-800">
								NPR {due.toLocaleString()}
							</span>
						</div>
					)}

					<div className="flex gap-3 pt-2">
						<button
							onClick={onClose}
							className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							onClick={() => mutation.mutate()}
							disabled={
								!selectedPatient || items.length === 0 || mutation.isLoading
							}
							className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
						>
							{mutation.isLoading ? "Creating..." : "Create Bill"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Payment Modal ─────────────────────────────────────────
const PaymentModal = ({ bill, onClose }) => {
	const queryClient = useQueryClient();
	const due = Number(bill.dueAmount);
	const [amount, setAmount] = useState(due);
	const [method, setMethod] = useState("CASH");
	const [reference, setReference] = useState("");

	const mutation = useMutation({
		mutationFn: () =>
			billingApi.addPayment(bill.id, {
				amount: Number(amount),
				method,
				reference,
			}),
		onSuccess: () => {
			toast.success("Payment recorded!");
			queryClient.invalidateQueries(["bills"]);
			onClose();
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Failed to record payment");
		},
	});

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
			<div className="bg-white rounded-2xl w-full max-w-md shadow-2xl my-6">
				<div className="flex items-center justify-between p-5 border-b">
					<h2 className="text-lg font-semibold">Record Payment</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-xl"
					>
						×
					</button>
				</div>

				<div className="p-5 space-y-4">
					<div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
						<div className="flex justify-between">
							<span className="text-gray-600">Bill</span>
							<span className="font-mono">{bill.billNumber}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">Total</span>
							<span>NPR {Number(bill.totalAmount).toLocaleString()}</span>
						</div>
						<div className="flex justify-between font-bold text-amber-700">
							<span>Amount Due</span>
							<span>NPR {due.toLocaleString()}</span>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Payment Amount (NPR) *
						</label>
						<input
							type="number"
							min="1"
							max={due}
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Payment Method
						</label>
						<select
							value={method}
							onChange={(e) => setMethod(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							{["CASH", "ESEWA", "KHALTI", "BANK_TRANSFER", "INSURANCE"].map(
								(m) => (
									<option key={m} value={m}>
										{m}
									</option>
								),
							)}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Reference (optional)
						</label>
						<input
							value={reference}
							onChange={(e) => setReference(e.target.value)}
							placeholder="Transaction ID / note"
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>

					<div className="flex gap-3 pt-2">
						<button
							onClick={onClose}
							className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							onClick={() => mutation.mutate()}
							disabled={
								mutation.isLoading ||
								Number(amount) <= 0 ||
								Number(amount) > due
							}
							className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
						>
							{mutation.isLoading ? "Saving..." : "Record Payment"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Main ─────────────────────────────────────────────────
const BillingPage = () => {
	const [showModal, setShowModal] = useState(false);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [payingBill, setPayingBill] = useState(null);

	const { data, isLoading } = useQuery({
		queryKey: ["bills", search, statusFilter],
		queryFn: () =>
			billingApi.list({ search, status: statusFilter }).then((r) => r.data),
	});

	return (
		<div className="p-6 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Billing / बिलिङ</h1>
					<p className="text-sm text-gray-500">
						{data?.meta?.total ?? 0} bills
					</p>
				</div>
				<button
					onClick={() => setShowModal(true)}
					className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
				>
					<Plus size={16} /> New Bill
				</button>
			</div>

			<div className="bg-white rounded-xl border border-gray-200">
				<div className="flex flex-wrap gap-3 p-4 border-b items-center">
					<div className="relative flex-1 min-w-48">
						<Search
							size={15}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search bill number or patient..."
							className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
					<div className="flex gap-2">
						{["", "PENDING", "PARTIAL", "PAID", "CANCELLED"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`px-3 py-1.5 text-xs rounded-full font-medium border transition-colors ${
									statusFilter === s
										? "bg-primary-600 text-white border-primary-600"
										: "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
								}`}
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
									"Bill #",
									"Patient",
									"Date",
									"Total",
									"Paid",
									"Due",
									"Status",
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
										colSpan={8}
										className="px-4 py-10 text-center text-gray-400"
									>
										Loading...
									</td>
								</tr>
							)}
							{data?.data?.map((bill) => (
								<tr key={bill.id} className="hover:bg-gray-50">
									<td className="px-4 py-3 font-mono text-xs text-gray-700">
										{bill.billNumber}
									</td>
									<td className="px-4 py-3">
										<p className="font-medium">{bill.patient?.fullName}</p>
										<p className="text-xs text-gray-400">
											{bill.patient?.patientCode}
										</p>
									</td>
									<td className="px-4 py-3 text-gray-600">
										{formatDate(bill.billDateAD)}
									</td>
									<td className="px-4 py-3 font-medium">
										NPR {Number(bill.totalAmount).toLocaleString()}
									</td>
									<td className="px-4 py-3 text-green-600">
										NPR {Number(bill.paidAmount).toLocaleString()}
									</td>
									<td className="px-4 py-3 text-red-600 font-medium">
										{Number(bill.dueAmount) > 0
											? `NPR ${Number(bill.dueAmount).toLocaleString()}`
											: "—"}
									</td>
									<td className="px-4 py-3">
										<StatusBadge status={bill.status} />
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-1">
											{Number(bill.dueAmount) > 0 &&
												bill.status !== "CANCELLED" &&
												bill.status !== "REFUNDED" && (
													<button
														onClick={() => setPayingBill(bill)}
														title="Record payment"
														className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
													>
														<DollarSign size={14} />
													</button>
												)}
											<button
												onClick={() => printInvoice(bill)}
												title="Print invoice"
												className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
											>
												<Printer size={14} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{showModal && <NewBillModal onClose={() => setShowModal(false)} />}
			{payingBill && (
				<PaymentModal bill={payingBill} onClose={() => setPayingBill(null)} />
			)}
		</div>
	);
};

export default BillingPage;
