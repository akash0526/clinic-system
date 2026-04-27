import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
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
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
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
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
						disabled={mutation.isLoading}
						className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
					>
						{mutation.isLoading ? "Saving..." : "Confirm"}
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
		<div className="p-6 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Inventory / भण्डार</h1>
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
							placeholder="Search items..."
							className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
					>
						<option value="">All Categories</option>
						<option value="MEDICINE">Medicine</option>
						<option value="CONSUMABLE">Consumable</option>
						<option value="EQUIPMENT">Equipment</option>
					</select>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b">
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
							{data?.data?.map((item) => (
								<tr key={item.id} className="hover:bg-gray-50">
									<td className="px-4 py-3 font-mono text-xs text-gray-600">
										{item.itemCode}
									</td>
									<td className="px-4 py-3 font-medium text-gray-900">
										{item.name}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{item.genericName || "—"}
									</td>
									<td className="px-4 py-3">
										<span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
											{item.category}
										</span>
									</td>
									<td className="px-4 py-3">
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
									<td className="px-4 py-3">
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
