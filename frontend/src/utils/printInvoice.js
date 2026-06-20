// Generates a clean, printable invoice in a new window.
// Self-contained (inline styles) so it prints reliably without app CSS.

const CLINIC = {
	name: "My Clinic",
	nameNe: "मेरो क्लिनिक",
	address: "Kathmandu, Nepal",
	phone: "01-4000000",
	email: "info@clinic.com",
	pan: "", // set your PAN/VAT number here
	currency: "NPR",
};

const money = (v) =>
	`${CLINIC.currency} ${Number(v || 0).toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

const fmtDate = (d) => {
	if (!d) return "—";
	try {
		return new Date(d).toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	} catch {
		return String(d);
	}
};

const esc = (s) =>
	String(s ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

export function printInvoice(bill) {
	const items = bill.items || [];

	const itemRows = items
		.map(
			(it, i) => `
		<tr>
			<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
			<td style="padding:6px 8px;border:1px solid #ddd;">${esc(it.description)}</td>
			<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${esc(it.category || "")}</td>
			<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${Number(it.quantity)}</td>
			<td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${money(it.unitPrice)}</td>
			<td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${money(it.totalPrice)}</td>
		</tr>`,
		)
		.join("");

	const discountRow =
		Number(bill.discountAmount) > 0
			? `<tr><td style="padding:4px 8px;text-align:right;">Discount${
					bill.discountType === "PERCENT"
						? ` (${Number(bill.discountValue)}%)`
						: ""
				}</td><td style="padding:4px 8px;text-align:right;">- ${money(
					bill.discountAmount,
				)}</td></tr>`
			: "";

	const taxRow =
		Number(bill.taxAmount) > 0
			? `<tr><td style="padding:4px 8px;text-align:right;">Tax (${Number(
					bill.taxPercent,
				)}%)</td><td style="padding:4px 8px;text-align:right;">${money(
					bill.taxAmount,
				)}</td></tr>`
			: "";

	const html = `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<title>Invoice ${esc(bill.billNumber)}</title>
	<style>
		@page { size: A4; margin: 16mm; }
		body { font-family: Arial, Helvetica, sans-serif; color:#222; font-size:13px; }
		.muted { color:#666; }
		.right { text-align:right; }
		table { border-collapse: collapse; width:100%; }
		.header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #333; padding-bottom:12px; margin-bottom:16px; }
		.badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:bold; }
	</style>
</head>
<body>
	<div class="header">
		<div>
			<div style="font-size:20px;font-weight:bold;">${esc(CLINIC.name)}</div>
			<div class="muted">${esc(CLINIC.nameNe)}</div>
			<div class="muted">${esc(CLINIC.address)}</div>
			<div class="muted">Tel: ${esc(CLINIC.phone)} ${
				CLINIC.email ? "· " + esc(CLINIC.email) : ""
			}</div>
			${CLINIC.pan ? `<div class="muted">PAN/VAT: ${esc(CLINIC.pan)}</div>` : ""}
		</div>
		<div class="right">
			<div style="font-size:18px;font-weight:bold;">INVOICE</div>
			<div class="muted">${esc(bill.billNumber)}</div>
			<div class="muted">Date: ${fmtDate(bill.billDateAD)}</div>
		</div>
	</div>

	<div style="margin-bottom:14px;">
		<strong>Bill To:</strong><br/>
		${esc(bill.patient?.fullName || "—")}<br/>
		<span class="muted">${esc(bill.patient?.patientCode || "")}${
			bill.patient?.phone ? " · " + esc(bill.patient.phone) : ""
		}</span>
	</div>

	<table>
		<thead>
			<tr style="background:#f3f4f6;">
				<th style="padding:8px;border:1px solid #ddd;">#</th>
				<th style="padding:8px;border:1px solid #ddd;text-align:left;">Description</th>
				<th style="padding:8px;border:1px solid #ddd;">Category</th>
				<th style="padding:8px;border:1px solid #ddd;">Qty</th>
				<th style="padding:8px;border:1px solid #ddd;">Unit Price</th>
				<th style="padding:8px;border:1px solid #ddd;">Total</th>
			</tr>
		</thead>
		<tbody>${itemRows}</tbody>
	</table>

	<div style="display:flex;justify-content:flex-end;margin-top:14px;">
		<table style="width:280px;">
			<tr><td style="padding:4px 8px;text-align:right;">Subtotal</td><td style="padding:4px 8px;text-align:right;">${money(
				bill.subtotal,
			)}</td></tr>
			${discountRow}
			${taxRow}
			<tr style="border-top:2px solid #333;font-weight:bold;font-size:15px;">
				<td style="padding:6px 8px;text-align:right;">TOTAL</td>
				<td style="padding:6px 8px;text-align:right;">${money(bill.totalAmount)}</td>
			</tr>
			<tr><td style="padding:4px 8px;text-align:right;color:#16a34a;">Paid</td><td style="padding:4px 8px;text-align:right;color:#16a34a;">${money(
				bill.paidAmount,
			)}</td></tr>
			<tr><td style="padding:4px 8px;text-align:right;color:#dc2626;font-weight:bold;">Due</td><td style="padding:4px 8px;text-align:right;color:#dc2626;font-weight:bold;">${money(
				bill.dueAmount,
			)}</td></tr>
		</table>
	</div>

	<div style="margin-top:18px;">
		Status:
		<span class="badge" style="background:#eef;color:#225;">${esc(bill.status)}</span>
		${bill.paymentMethod ? `<span class="muted"> · ${esc(bill.paymentMethod)}</span>` : ""}
	</div>

	${bill.notes ? `<div style="margin-top:12px;" class="muted"><strong>Notes:</strong> ${esc(bill.notes)}</div>` : ""}

	<div style="margin-top:50px;display:flex;justify-content:space-between;">
		<div>_________________________<br/><span class="muted">Received by</span></div>
		<div class="right">_________________________<br/><span class="muted">Authorized signature</span></div>
	</div>

	<div style="margin-top:30px;text-align:center;font-size:11px;" class="muted">
		Thank you. This is a computer-generated invoice.
	</div>

	<script>
		window.onload = function () { window.print(); };
	</script>
</body>
</html>`;

	const w = window.open("", "_blank", "width=850,height=900");
	if (!w) {
		alert("Please allow pop-ups to print the invoice.");
		return;
	}
	w.document.open();
	w.document.write(html);
	w.document.close();
}
