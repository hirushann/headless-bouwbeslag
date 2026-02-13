"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  brand?: string;
  model?: string;
  isMaatwerk?: boolean;
  hasLengthFreight?: boolean;
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQty = useCartStore((state) => state.updateQty);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.total());
  // console.log("Cart items:", items);

  return (
    <main className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <p className="mb-4 text-gray-500">Items in cart: {items.length}</p>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between border-b py-4">
              <div className="flex gap-4 items-center">
                {item.image && <img src={item.image} alt={item.name} width={80} />}
                <div>
                  <h2 className="font-medium text-[#1C2530]">{item.name}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 border rounded flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQty(item.id, Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-14 border rounded text-center py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Quantity"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-8 h-8 border rounded flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {item.hasLengthFreight && (
                    <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-.447-.26-.847-.665-1.025l-3.375-1.5a1.125 1.125 0 0 0-1.025.047l-3.375 1.5a1.125 1.125 0 0 0-.665 1.025v3" /></svg>
                      Lengtevracht toeslag van toepassing
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
                <button
                  className="text-red-500"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-96 border rounded p-4">
              <div className="flex justify-between">
                <span className="text-[#3D4752]">Subtotal</span>
                <span className="font-semibold">€{total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Shipping &amp; taxes calculated at checkout.</p>
              <Link href="/checkout">
                <button className="mt-4 w-full bg-[#0066FF] text-white px-6 py-3 rounded-sm">
                  Proceed to Checkout
                </button>
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="mt-2 w-full border px-6 py-2 rounded-sm"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}