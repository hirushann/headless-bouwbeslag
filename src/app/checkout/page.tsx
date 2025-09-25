"use client";

import { useEffect, useState } from "react";
import { createOrder } from "@/lib/woocommerce-order";

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billing, setBilling] = useState({
    first_name: "",
    last_name: "",
    address_1: "",
    city: "",
    postcode: "",
    country: "NL",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  const handleOrder = async () => {
    const order = await createOrder(cart, billing);
    console.log("Order response:", order);

    if (order.id) {
      alert("Order placed successfully!");
      localStorage.removeItem("cart");
    } else {
      alert("Order failed. Check console.");
    }
  };

  return (
    <main className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Billing form */}
      <div className="grid gap-4">
        <input
          placeholder="First Name"
          value={billing.first_name}
          onChange={(e) => setBilling({ ...billing, first_name: e.target.value })}
          className="border p-2"
        />
        <input
          placeholder="Last Name"
          value={billing.last_name}
          onChange={(e) => setBilling({ ...billing, last_name: e.target.value })}
          className="border p-2"
        />
        <input
          placeholder="Email"
          value={billing.email}
          onChange={(e) => setBilling({ ...billing, email: e.target.value })}
          className="border p-2"
        />
        <input
          placeholder="Phone"
          value={billing.phone}
          onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
          className="border p-2"
        />
        <input
          placeholder="Address"
          value={billing.address_1}
          onChange={(e) => setBilling({ ...billing, address_1: e.target.value })}
          className="border p-2"
        />
        <input
          placeholder="City"
          value={billing.city}
          onChange={(e) => setBilling({ ...billing, city: e.target.value })}
          className="border p-2"
        />
        <input
          placeholder="Postcode"
          value={billing.postcode}
          onChange={(e) => setBilling({ ...billing, postcode: e.target.value })}
          className="border p-2"
        />
      </div>

      {/* Place order */}
      <button
        className="mt-6 bg-[#0066FF] text-white px-6 py-3 rounded-sm"
        onClick={handleOrder}
      >
        Place Order
      </button>
    </main>
  );
}