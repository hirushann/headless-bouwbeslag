import assert from "node:assert/strict";
import test from "node:test";
import {
  addCartItem,
  calculateCartTotal,
  normalizeCartItems,
  removeCartItem,
  updateCartQuantity,
  type CartItem,
} from "../../src/lib/cart-state.ts";

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: "10",
  name: "Deurklink",
  price: 20,
  quantity: 1,
  ...overrides,
});

test("add, quantity, remove, and clear transitions stay synchronized", () => {
  let items: CartItem[] = [];
  items = addCartItem(items, item());
  assert.equal(items.length, 1);
  assert.equal(calculateCartTotal(items), 20);

  items = addCartItem(items, item({ quantity: 2 }));
  assert.equal(items[0].quantity, 3);
  assert.equal(calculateCartTotal(items), 60);

  items = updateCartQuantity(items, 10, 4);
  assert.equal(items[0].quantity, 4);
  assert.equal(calculateCartTotal(items), 80);

  items = removeCartItem(items, 10);
  assert.deepEqual(items, []);

  items = [];
  assert.equal(calculateCartTotal(items), 0);
});

test("runtime string IDs from persisted/API data are normalized", () => {
  const persisted = [item({ id: "10" })];
  const normalized = normalizeCartItems(persisted);
  assert.equal(normalized[0].id, "10");

  const updated = updateCartQuantity(normalized, "10", 2);
  assert.equal(updated[0].quantity, 2);
  assert.deepEqual(removeCartItem(updated, "10"), []);
});

test("UUID product IDs remain valid cart identities", () => {
  const id = "12bc2a1a-d564-4861-abbf-3f6dad4b2a93";
  let items = addCartItem([], item({ id, productId: 5817 }));

  assert.equal(items[0].id, id);
  assert.equal(items[0].productId, 5817);
  items = updateCartQuantity(items, id, 3);
  assert.equal(items[0].quantity, 3);
  assert.deepEqual(removeCartItem(items, id), []);
});

test("invalid quantities are clamped and duplicate persisted rows are merged", () => {
  const normalized = normalizeCartItems([
    item({ quantity: 0 }),
    item({ id: "10", quantity: 2 }),
  ]);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].quantity, 3);
  assert.equal(updateCartQuantity(normalized, 10, -5)[0].quantity, 1);
});
