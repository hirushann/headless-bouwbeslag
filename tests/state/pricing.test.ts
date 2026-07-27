import assert from "node:assert/strict";
import test from "node:test";

import {
  addVat,
  applyVolumeDiscount,
  formatPrice,
  getProductPricing,
  getVolumeDiscount,
  getVolumeDiscounts,
} from "../../src/lib/pricing.ts";

const product = {
  price: { amount: "12.00" },
  sale_price: "11.00",
  regular_price: "15.00",
  price_b2c: { amount: "10.005" },
  meta_data: [
    { key: "crucial_data_b2b_and_b2c_sales_price_b2b", value: "8.335" },
    { key: "crucial_data_unit_price", value: "20" },
    {
      key: "crucial_data_discounts",
      value: [
        { discount_quantity: "10", discount_percentage: "5" },
        { discount_quantity: "20", discount_percentage: "10" },
      ],
    },
  ],
};

test("all consumers get the same role price, VAT and cents rounding", () => {
  const b2c = getProductPricing(product, { isB2B: false });
  const b2b = getProductPricing(product, { isB2B: true });

  assert.deepEqual(
    { ex: b2c.unitExVat, incl: b2c.finalPrice, formatted: formatPrice(b2c.finalPrice) },
    { ex: 10.01, incl: 12.11, formatted: "€ 12,11" },
  );
  assert.deepEqual(
    { ex: b2b.finalPrice, incl: b2b.secondaryPrice, discount: b2b.discountPercent },
    { ex: 8.34, incl: 10.09, discount: 58 },
  );
  assert.equal(addVat(b2c.cartPrice), b2c.finalPrice);
});

test("backend campaign price is the fallback when no customer price exists", () => {
  assert.equal(
    getProductPricing({ price: "9.50", sale_price: "10", regular_price: "12" }, { isB2B: false }).unitExVat,
    9.5,
  );
});

test("volume discounts use the active quantity tier and round before VAT", () => {
  const discounts = getVolumeDiscounts(product);
  assert.equal(getVolumeDiscount(discounts, 19), 5);
  assert.equal(applyVolumeDiscount(10.005, discounts, 20), 9);
  const price = getProductPricing(product, {
    isB2B: false,
    quantity: 19,
    discountPercentage: getVolumeDiscount(discounts, 19),
  });
  assert.deepEqual(
    { unitExVat: price.unitExVat, unitInclVat: price.unitInclVat, total: price.totalPrice },
    { unitExVat: 9.5, unitInclVat: 11.5, total: 218.41 },
  );
});

test("product, cart, checkout, email, and Moneybird share per-line rounding", () => {
  assert.equal(getProductPricing(
    { price_b2c: "33.01" },
    { isB2B: false, quantity: 3 },
  ).totalPrice, 119.83);
});
