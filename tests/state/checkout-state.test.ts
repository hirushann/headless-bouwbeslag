import assert from "node:assert/strict";
import test from "node:test";
import { calculateCheckoutTotals, calculateCouponDiscount, calculateOrderAmounts, centsPerQuantityToPrecision, createSubmissionGuard, resolveCouponValidation, resolveOrderVerification } from "../../src/lib/checkout-state.ts";
import { resolveMollieOrderOutcome } from "../../src/lib/mollie-payment-state.ts";

test("applying and removing percentage coupons updates totals immediately", () => {
  const applied = resolveCouponValidation({
    success: true,
    coupon: { code: "SAVE10", amount: "10", discount_type: "percent" },
  });
  assert.equal(applied.coupon?.code, "SAVE10");
  assert.equal(calculateCouponDiscount(100, applied.coupon), 10);
  assert.equal(calculateCouponDiscount(100, null), 0);
});

test("fixed cart coupons convert gross discount to ex-VAT totals", () => {
  assert.equal(
    calculateCouponDiscount(100, { code: "FIXED", amount: "12.10", discount_type: "fixed_cart" }),
    10,
  );
});

test("a failed validation clears stale coupon success state", () => {
  const failed = resolveCouponValidation({ success: false, message: "Coupon verlopen" });
  assert.equal(failed.coupon, null);
  assert.deepEqual(failed.message, { type: "error", text: "Coupon verlopen" });
});

test("frontend and order payload totals share shipping, VAT, discount, and fees", () => {
  assert.deepEqual(
    calculateCheckoutTotals({
      subtotalExVat: 100,
      discountExVat: 10,
      shippingExVat: 5,
      feesExVat: 2.5,
    }),
    { netTotal: 97.5, tax: 20.48, grossTotal: 117.98 },
  );
});

test("B2C email and Moneybird use the stored per-line half-up total", () => {
  const amounts = calculateOrderAmounts({
    items: [{ unitPriceExVat: "81.84", quantity: 1 }],
    vatRate: 21,
  });

  assert.equal(amounts.lines[0].unitInclVat, "99.03");
  assert.equal(amounts.lines[0].lineExVat, "81.84");
  assert.equal(amounts.lines[0].lineVat, "17.19");
  assert.equal(amounts.lines[0].lineTotal, "99.03");
  assert.equal(amounts.total, "99.03");
});

test("multiple quantities round VAT per line, not rounded gross unit times quantity", () => {
  const amounts = calculateOrderAmounts({
    items: [{ unitPriceExVat: "33.01", quantity: 3 }],
    vatRate: 21,
  });

  assert.equal(amounts.lines[0].unitInclVat, "39.94");
  assert.equal(amounts.lines[0].lineExVat, "99.03");
  assert.equal(amounts.lines[0].lineVat, "20.80");
  assert.equal(amounts.lines[0].lineTotal, "119.83");
  assert.notEqual(amounts.lines[0].lineTotal, "119.82");
  assert.equal(centsPerQuantityToPrecision(amounts.lines[0].lineTotalCents, 3), "39.9433333333");
});

test("B2C discounts and shipping share the same stored totals", () => {
  const amounts = calculateOrderAmounts({
    items: [
      { unitPriceExVat: "33.01", quantity: 3 },
      { unitPriceExVat: "10.00", quantity: 2 },
    ],
    shippingExVat: "7.50",
    discountExVat: "5.00",
    vatRate: 21,
  });

  assert.deepEqual(
    {
      subtotal: amounts.subtotalExVat,
      shipping: amounts.shippingTotal,
      discountVat: amounts.discountVat,
      vat: amounts.tax,
      total: amounts.total,
    },
    {
      subtotal: "119.03",
      shipping: "9.08",
      discountVat: "1.05",
      vat: "25.53",
      total: "147.06",
    },
  );
});

test("B2B VAT-exclusive orders preserve net line, shipping, and grand totals", () => {
  const amounts = calculateOrderAmounts({
    items: [{ unitPriceExVat: "33.01", quantity: 3 }],
    shippingExVat: "7.50",
    discountExVat: "5.00",
    vatRate: 0,
  });

  assert.deepEqual(
    { line: amounts.lines[0].lineTotal, vat: amounts.tax, total: amounts.total },
    { line: "99.03", vat: "0.00", total: "101.53" },
  );
});

test("discounts cannot produce a negative payable total", () => {
  assert.deepEqual(
    calculateCheckoutTotals({ subtotalExVat: 10, discountExVat: 50 }),
    { netTotal: 0, tax: 0, grossTotal: 0 },
  );
});

test("duplicate order submission is blocked until the active request settles", () => {
  const guard = createSubmissionGuard();
  assert.equal(guard.tryStart(), true);
  assert.equal(guard.tryStart(), false);
  guard.release();
  assert.equal(guard.tryStart(), true);
});

test("backend and payment failures never resolve to a success screen", () => {
  assert.deepEqual(resolveOrderVerification({ success: false, status: "backend_failed", message: "Order failed" }), {
    status: "backend_failed",
    clearCart: false,
    message: "Order failed",
  });
  assert.equal(resolveOrderVerification({ success: true, status: "failed" }).clearCart, false);
  assert.equal(resolveOrderVerification({ success: true, status: "processing" }).clearCart, true);
});

test("only a paid Mollie status makes an order processable", () => {
  assert.equal(resolveMollieOrderOutcome("paid"), "processing");
  assert.equal(resolveMollieOrderOutcome("canceled"), "cancelled");
  assert.equal(resolveMollieOrderOutcome("failed"), "failed");
  assert.equal(resolveMollieOrderOutcome("expired"), "failed");
  assert.equal(resolveMollieOrderOutcome("open"), "pending");
  assert.equal(resolveMollieOrderOutcome("pending"), "pending");
  assert.equal(resolveMollieOrderOutcome("authorized"), "pending");
});
