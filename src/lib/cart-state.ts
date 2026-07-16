export interface CartItem {
  id: string;
  productId?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  brand?: string;
  model?: string;
  deliveryText?: string;
  deliveryType?: string;
  slug?: string;
  stockStatus?: string;
  stockQuantity?: number | null;
  leadTimeInStock?: number;
  leadTimeNoStock?: number;
  isMaatwerk?: boolean;
  hasLengthFreight?: boolean;
  sync_id?: string;
  sku?: string;
}

export type CartItemId = string | number;

export const normalizeCartItem = (item: CartItem): CartItem => ({
  ...item,
  id: String(item.id ?? "").trim(),
  price: Number(item.price) || 0,
  quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
});

export const normalizeCartItems = (items: CartItem[] = []): CartItem[] => {
  const normalized = new Map<string, CartItem>();
  for (const rawItem of items) {
    const item = normalizeCartItem(rawItem);
    if (!item.id) continue;
    const existing = normalized.get(item.id);
    normalized.set(
      item.id,
      existing
        ? { ...existing, ...item, quantity: existing.quantity + item.quantity }
        : item,
    );
  }
  return [...normalized.values()];
};

export const addCartItem = (items: CartItem[], rawItem: CartItem): CartItem[] => {
  const item = normalizeCartItem(rawItem);
  if (!item.id) return items;
  const existing = items.find((candidate) => String(candidate.id) === item.id);
  if (!existing) return [...items, item];
  return items.map((candidate) =>
    String(candidate.id) === item.id
      ? { ...candidate, ...item, id: item.id, quantity: candidate.quantity + item.quantity }
      : candidate,
  );
};

export const removeCartItem = (items: CartItem[], id: CartItemId): CartItem[] => {
  const normalizedId = String(id);
  return items.filter((item) => String(item.id) !== normalizedId);
};

export const updateCartQuantity = (items: CartItem[], id: CartItemId, quantity: number): CartItem[] => {
  const normalizedId = String(id);
  const normalizedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
  return items.map((item) =>
    String(item.id) === normalizedId
      ? {
          ...item,
          id: normalizedId,
          quantity: normalizedQuantity,
          deliveryText: undefined,
          deliveryType: undefined,
        }
      : item,
  );
};

export const calculateCartTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);
