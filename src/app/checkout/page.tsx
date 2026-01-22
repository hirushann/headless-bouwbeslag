"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/UserContext";

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const { user, isLoading: isUserLoading } = useUserContext();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Wait for user data to be ready
    if (isUserLoading) return;

    // If cart is empty, redirect to home
    if (items.length === 0) {
      router.push("/");
      return;
    }

    const ids = items.map((item) => item.id).join(",");
    const quantities = items.map((item) => item.quantity).join(",");
    const baseUrl = (process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl").replace(/\/$/, "");
    
    let url = `${baseUrl}/checkout/?add-to-cart=${ids}&quantity=${quantities}`;

    // Append billing details if user exists
    if (user?.billing) {
      const billing = user.billing;
      const params = new URLSearchParams();
      
      if (billing.first_name) params.append('billing_first_name', billing.first_name);
      if (billing.last_name) params.append('billing_last_name', billing.last_name);
      if (billing.company) params.append('billing_company', billing.company);
      if (billing.address_1) params.append('billing_address_1', billing.address_1);
      if (billing.address_2) params.append('billing_address_2', billing.address_2);
      if (billing.city) params.append('billing_city', billing.city);
      if (billing.postcode) params.append('billing_postcode', billing.postcode);
      if (billing.country) params.append('billing_country', billing.country);
      if (billing.email) params.append('billing_email', billing.email);
      if (billing.phone) params.append('billing_phone', billing.phone);
      
      // Also map shipping if needed, usually mostly same or handled by 'ship_to_different_address'
      if (user.shipping) {
          const shipping = user.shipping;
           if (shipping.first_name) params.append('shipping_first_name', shipping.first_name);
           if (shipping.last_name) params.append('shipping_last_name', shipping.last_name);
           if (shipping.company) params.append('shipping_company', shipping.company);
           if (shipping.address_1) params.append('shipping_address_1', shipping.address_1);
           if (shipping.address_2) params.append('shipping_address_2', shipping.address_2);
           if (shipping.city) params.append('shipping_city', shipping.city);
           if (shipping.postcode) params.append('shipping_postcode', shipping.postcode);
           if (shipping.country) params.append('shipping_country', shipping.country);
      }

      url += `&${params.toString()}`;
    }

    setCheckoutUrl(url);

    // Redirect immediately
    window.location.href = url;
  }, [items, router, isUserLoading, user]);

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-gray-600">
            {isUserLoading ? "Gegevens laden..." : "Doorverwijzen naar checkout..."}
          </p>
        </div>
      </div>
  );

  /*
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
  */
}