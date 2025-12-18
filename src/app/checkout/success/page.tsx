
"use client";

import { useCartStore } from "@/lib/cartStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Immediately clear the cart on MOUNT
    clearCart();
    // Also clear localStorage manually just in case persistent store misses it
    // because sometimes Zustand persist hydration can be tricky with SSR
    if (typeof window !== "undefined") {
        // We rely on Zustand's clearCart to do the right thing, 
        // but we can also fire the 'storage' event if needed.
        // For now, clearCart() changes the store which updates local storage.
    }
    setCleared(true);
  }, [clearCart]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-green-100 p-6 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-16 h-16 text-green-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold mb-2">Bedankt voor je bestelling!</h1>
      {orderId && <p className="text-gray-600 mb-6">Order nummer: #{orderId}</p>}
      
      <p className="max-w-md text-gray-500 mb-8">
        We hebben je bestelling in goede orde ontvangen. Je ontvangt binnen enkele minuten een bevestiging per e-mail.
      </p>

      <div className="flex gap-4">
        <Link href="/" className="bg-[#0066FF] text-white font-bold px-6 py-3 rounded-md hover:bg-blue-700 transition">
          Terug naar Home
        </Link>
        <Link href="/account?tab=orders" className="border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-md hover:bg-gray-50 transition">
          Bekijk bestelling
        </Link>
      </div>
    </div>
  );
}
