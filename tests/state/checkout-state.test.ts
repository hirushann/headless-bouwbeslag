import assert from "node:assert/strict";
import test from "node:test";
import { calculateCheckoutTotals, calculateCouponDiscount, createSubmissionGuard, resolveCouponValidation, resolveOrderVerification } from "../../src/lib/checkout-state.ts";

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
