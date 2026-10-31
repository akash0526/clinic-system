import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import toast from "react-hot-toast";
import api from "../../api/axios";

const inventoryApi = {
	list: (params) => api.get("/inventory", { params }),
	create: (data) => api.post("/inventory", data),
	update: (id, d) => api.put(`/inventory/${id}`, d),
	adjustStock: (id, d) => api.post(`/inventory/${id}/stock`, d),
};

const StockAdjustModal = ({ item, onClose }) => {
	const queryClient = useQueryClient();
	const [type, setType] = useState("PURCHASE");
	const [quantity, setQuantity] = useState(1);
	const [notes, setNotes] = useState("");

	const mutation = useMutation({
		mutationFn: () =>
			inventoryApi.adjustStock(item.id, {
				type,
				quantity: Number(quantity),
				notes,
			}),
		onSuccess: () => {
			toast.success("Stock adjusted");
			queryClient.invalidateQueries(["inventory"]);
			onClose();
		},
	});

	return (
		<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in z-50 flex items-center justify-center p-4">
			<div className="relative bg-white rounded-2xl border border-slate-200/70 shadow-pop animate-scale-in w-full max-w-sm p-6">
				<h3 className="text-lg font-semibold mb-1">Adjust Stock</h3>
				<p className="text-sm text-gray-500 mb-4">
					{item.name} · Current: {item.currentStock} {item.unit}
				</p>

				<div className="space-y-3">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Transaction Type
						</label>
						<select
							value={type}
							onChange={(e) => setType(e.target.value)}
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white"
						>
							<option value="PURCHASE">Purchase (In)</option>
							<option value="DISPENSED">Dispensed (Out)</option>
							<option value="ADJUSTMENT">Manual Adjustment</option>
							<option value="EXPIRED">Expired (Out)</option>
							<option value="RETURNED">Returned (In)</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Quantity
						</label>
						<input
							type="number"
							min="1"
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Notes
						</label>
						<input
							type="text"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Optional notes..."
							className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
						/>
					</div>
				</div>

				<div className="flex gap-3 mt-5">
					<button
						onClick={onClose}
						className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						onClick={() => mutation.mutate()}
						disabled={mutation.isPending}
						className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
					>
						{mutation.isPending ? "Saving..." : "Confirm"}
					</button>
				</div>
			</div>
		</div>
	);
};

const InventoryPage = () => {
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [adjustItem, setAdjustItem] = useState(null);

	const { data, isLoading } = useQuery({
		queryKey: ["inventory", search, category],
		queryFn: () => inventoryApi.list({ search, category }).then((r) => r.data),
	});

	return (
		<div className="page">
			<PageHeader
				title="Inventory"
				description="Medicines, consumables and equipment · भण्डार"
			/>

			<div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
				<div className="flex flex-wrap gap-3 p-4 border-b">
					<div className="relative flex-1 min-w-48">
						<Search
							size={15}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search items..."
							className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm"
						/>
					</div>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white"
					>
						<option value="">All Categories</option>
						<option value="MEDICINE">Medicine</option>
						<option value="CONSUMABLE">Consumable</option>
						<option value="EQUIPMENT">Equipment</option>
					</select>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-slate-50/80">
							<tr>
								{[
									"Code",
									"Item Name",
									"Generic",
									"Category",
									"Stock",
									"Min.",
									"Selling Price",
									"Actions",
								].map((h) => (
									<th
										key={h}
										className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
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
							{data?.data?.map((item) => (
								<tr key={item.id} className="transition-colors hover:bg-slate-50/70">
									<td className="px-4 py-3 font-mono text-xs text-gray-600">
										{item.itemCode}
									</td>
									<td className="px-4 py-3 font-medium text-gray-900">
										{item.name}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{item.genericName || "—"}
									</td>
									<td className="px-4 py-3.5">
										<span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
											{item.category}
										</span>
									</td>
									<td className="px-4 py-3.5">
										<div className="flex items-center gap-1">
											{item.currentStock <= item.minimumStock && (
												<AlertTriangle size={13} className="text-amber-500" />
											)}
											<span
												className={`font-medium ${item.currentStock <= item.minimumStock ? "text-red-600" : "text-gray-900"}`}
											>
												{item.currentStock}
											</span>
											<span className="text-gray-400 text-xs">{item.unit}</span>
										</div>
									</td>
									<td className="px-4 py-3 text-gray-500">
										{item.minimumStock}
									</td>
									<td className="px-4 py-3 text-gray-700">
										NPR {Number(item.sellingPrice).toLocaleString()}
									</td>
									<td className="px-4 py-3.5">
										<button
											onClick={() => setAdjustItem(item)}
											className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-2 py-1 rounded font-medium"
										>
											Adjust
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{adjustItem && (
				<StockAdjustModal
					item={adjustItem}
					onClose={() => setAdjustItem(null)}
				/>
			)}
		</div>
	);
};

export default InventoryPage;
