// Pure unit tests for billing math. No DB needed.
// Run with Node's built-in test runner:  node --test
//
// To use: extract the calculation into a pure function. Below we re-implement
// the same logic as bill.service.createBill so it can be tested in isolation.
// (Recommended refactor: export `computeBillTotals` from bill.service.js and
//  import it here instead of duplicating.)

const test = require("node:test");
const assert = require("node:assert/strict");

function computeBillTotals(data) {
	const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
	const discountAmount =
		data.discountType === "PERCENT"
			? subtotal * ((data.discountValue || 0) / 100)
			: data.discountValue || 0;
	const afterDiscount = Math.max(0, subtotal - discountAmount);
	const taxAmount = afterDiscount * ((data.taxPercent || 0) / 100);
	const totalAmount = afterDiscount + taxAmount;
	const paidAmount = data.paidAmount || 0;
	const dueAmount = Math.max(0, totalAmount - paidAmount);
	const status =
		dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";
	return {
		subtotal,
		discountAmount,
		taxAmount,
		totalAmount,
		dueAmount,
		status,
	};
}

test("simple bill, no discount/tax, unpaid", () => {
	const r = computeBillTotals({
		items: [{ quantity: 2, unitPrice: 100 }],
	});
	assert.equal(r.subtotal, 200);
	assert.equal(r.totalAmount, 200);
	assert.equal(r.dueAmount, 200);
	assert.equal(r.status, "PENDING");
});

test("percentage discount + tax", () => {
	const r = computeBillTotals({
		items: [{ quantity: 1, unitPrice: 1000 }],
		discountType: "PERCENT",
		discountValue: 10, // -100 => 900
		taxPercent: 13, // +117 => 1017
	});
	assert.equal(r.discountAmount, 100);
	assert.equal(r.taxAmount, 117);
	assert.equal(r.totalAmount, 1017);
});

test("fully paid => PAID", () => {
	const r = computeBillTotals({
		items: [{ quantity: 1, unitPrice: 500 }],
		paidAmount: 500,
	});
	assert.equal(r.status, "PAID");
	assert.equal(r.dueAmount, 0);
});

test("partial payment => PARTIAL", () => {
	const r = computeBillTotals({
		items: [{ quantity: 1, unitPrice: 500 }],
		paidAmount: 200,
	});
	assert.equal(r.status, "PARTIAL");
	assert.equal(r.dueAmount, 300);
});

test("discount never makes total negative", () => {
	const r = computeBillTotals({
		items: [{ quantity: 1, unitPrice: 100 }],
		discountType: "AMOUNT",
		discountValue: 999,
	});
	assert.equal(r.totalAmount, 0);
	assert.ok(r.dueAmount >= 0);
});
