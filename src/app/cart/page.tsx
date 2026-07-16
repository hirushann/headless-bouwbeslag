"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import Image from "next/image";
import { useUserContext } from "@/context/UserContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  brand?: string;
  model?: string;
  sku?: string;
}

export default function CartPage() {
  const { isB2B, isLoading: isUserLoading } = useUserContext();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQty = useCartStore((state) => state.updateQty);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalExVat = useCartStore((state) => state.total());
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const priceMultiplier = isB2B ? 1 : 1.21;
  const displayTotal = totalExVat * priceMultiplier;

  if (!hasHydrated || isUserLoading) {
    return (
      <main className="max-w-4xl mx-auto py-10 px-4" aria-busy="true">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="h-28 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Winkelwagen</h1>
      <p className="mb-4 text-gray-500">Artikelen in winkelwagen: {items.length}</p>
      {items.length === 0 ? (
        <div className="rounded border p-8 text-center">
          <p className="text-gray-600">Je winkelwagen is leeg.</p>
          <Link href="/" className="mt-4 inline-block font-semibold text-[#0050D1] hover:underline">
            Verder winkelen
          </Link>
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between border-b py-4">
              <div className="flex gap-4 items-center">
                {item.image && <Image src={item.image} alt={item.name} width={80} height={80} className="object-contain" />}
                <div>
                  <h2 className="font-medium text-[#1C2530]">{item.name}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 border rounded flex items-center justify-center"
                      aria-label={`${item.name} aantal verlagen`}
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
                      aria-label={`${item.name} aantal`}
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-8 h-8 border rounded flex items-center justify-center"
                      aria-label={`${item.name} aantal verhogen`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">€{(item.price * item.quantity * priceMultiplier).toFixed(2)}</p>
                <button
                  className="text-red-500"
                  onClick={() => removeItem(item.id)}
                  aria-label={`${item.name} verwijderen uit winkelwagen`}
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-96 border rounded p-4">
              <div className="flex justify-between">
                <span className="text-[#3D4752]">Subtotaal</span>
                <span className="font-semibold">€{displayTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isB2B ? "Exclusief btw. Verzendkosten worden berekend bij het afrekenen." : "Inclusief btw. Verzendkosten worden berekend bij het afrekenen."}
              </p>
              <Link href="/checkout">
                <button className="mt-4 w-full bg-[#0066FF] text-white px-6 py-3 rounded-sm">
                  Afrekenen
                </button>
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="mt-2 w-full border px-6 py-2 rounded-sm"
              >
                Winkelwagen leegmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
