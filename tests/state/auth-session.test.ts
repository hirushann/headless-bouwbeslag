import assert from "node:assert/strict";
import test from "node:test";
import {
  clearPersistedSession,
  isBusinessUser,
  normalizeRoles,
  persistSession,
  persistUser,
  readPersistedSession,
} from "../../src/lib/auth-session.ts";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("login, profile update, and logout update the same persisted session", () => {
  const storage = new MemoryStorage();
  persistSession(storage, {
    access_token: "token-1",
    user: { id: 7, first_name: "Jan", roles: ["customer"] },
  });
  assert.deepEqual(readPersistedSession(storage), {
    token: "token-1",
    user: { id: 7, first_name: "Jan", roles: ["customer"] },
  });

  persistUser(storage, { id: 7, first_name: "Piet", roles: ["customer"] });
  assert.equal(readPersistedSession(storage).user?.first_name, "Piet");

  clearPersistedSession(storage);
  assert.deepEqual(readPersistedSession(storage), { token: null, user: null });
});

test("role variants normalize consistently for B2B pricing", () => {
  assert.deepEqual(normalizeRoles({ role: "customer" }), ["customer"]);
  const roles = normalizeRoles({ roles: ["b2b_customer"] });
  assert.equal(isBusinessUser(null, roles), true);
  assert.equal(isBusinessUser({ b2b_status: "approved" }, null), true);
  assert.equal(isBusinessUser({ role: "customer" }, ["customer"]), false);
});

test("corrupt cached customer data is discarded without retaining stale UI data", () => {
  const storage = new MemoryStorage();
  storage.setItem("token", "token-1");
  storage.setItem("user", "not-json");
  assert.deepEqual(readPersistedSession(storage), { token: "token-1", user: null });
  assert.equal(storage.getItem("user"), null);
});
