"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // If cart is empty, redirect to home
    if (items.length === 0) {
      router.push("/");
      return;
    }

    const ids = items.map((item) => item.id).join(",");
    const quantities = items.map((item) => item.quantity).join(",");
    const baseUrl = (process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl").replace(/\/$/, "");
    
    // Construct the WP checkout URL with auto-add params
    const url = `${baseUrl}/checkout/?add-to-cart=${ids}&quantity=${quantities}`;
    setCheckoutUrl(url);
  }, [items, router]);

  if (!checkoutUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-gray-600">Laden van checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white">
      <iframe
        src={checkoutUrl}
        className="w-full h-full border-0"
        title="Bouwbeslag Checkout"
        allow="payment" // Allow payment API if needed
      />
    </div>
  );
}