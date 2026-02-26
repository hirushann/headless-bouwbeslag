"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { syncRemoveItem } from "@/lib/cartApi";
import { getDeliveryInfo } from "@/lib/deliveryUtils";
import { useEffect, useState } from "react";
import { refreshCartStockAction } from "@/app/actions";

interface CartDrawerProps {
  isB2B: boolean;
  taxLabel: string;
  shippingMethods: any[];
}

export default function CartDrawer({ isB2B, taxLabel, shippingMethods }: CartDrawerProps) {
  const items = useCartStore((state) => state.items);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const updateStockForItems = useCartStore((state) => state.updateStockForItems);
  const lengthFreightCost = useCartStore((state) => state.lengthFreightCost());

  const [isFetchingStock, setIsFetchingStock] = useState(false);

  // Dynamic Stock Update on Open
  useEffect(() => {
    let active = true;

    const fetchStock = async () => {
      if (items.length === 0) return;

      setIsFetchingStock(true);
      try {
        const ids = items.map(i => i.id);
        const res = await refreshCartStockAction(ids);

        if (active && res.success && res.data) {
          updateStockForItems(res.data);
        }
      } catch (error) {
        // console.error("Failed to refresh cart stock:", error);
      } finally {
        if (active) setIsFetchingStock(false);
      }
    };

    if (isCartOpen) {
      fetchStock();
    }

    return () => { active = false; };
  }, [isCartOpen, items.length]); // Re-run if cart opens or items change count (basic check)

  const subtotal = items.reduce((sum, item) => {
    const displayedItemPrice = isB2B ? item.price : item.price * 1.21;
    return sum + displayedItemPrice * item.quantity;
  }, 0);

  let flatRate = 0;
  let freeShippingThreshold: number | null = null;

  if (shippingMethods && Array.isArray(shippingMethods)) {
    const flatMethod = shippingMethods.find((m) => m.methodId === "flat_rate" && m.enabled);
    if (flatMethod) flatRate = flatMethod.cost;

    const freeMethod = shippingMethods.find((m) => m.methodId === "free_shipping" && m.enabled);
    if (freeMethod) {
      const m = freeMethod as any;
      if (m.requires === "min_amount" || m.requires === "either") {
        freeShippingThreshold = parseFloat(m.minAmount || "0");
      } else if (m.requires === "") {
        freeShippingThreshold = 0;
      }
    }
  }

  const hasLengthFreight = items.some((i) => i.hasLengthFreight);
  const isFreeShipping = freeShippingThreshold !== null && subtotal >= freeShippingThreshold;
  const shipping = hasLengthFreight ? lengthFreightCost / 1.21 : isFreeShipping ? 0 : flatRate;
  const displayShipping = isB2B ? shipping : shipping * 1.21;

  const increaseQuantity = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item) useCartStore.getState().updateQty(id, item.quantity + 1);
  };

  const decreaseQuantity = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (item && item.quantity > 1) useCartStore.getState().updateQty(id, item.quantity - 1);
  };

  const removeItem = (id: number) => {
    useCartStore.getState().removeItem(id);
    syncRemoveItem(id).catch((err) => console.error("Background sync failed:", err));
  };

  return (
    <div className={`fixed inset-0 z-[60] transition-all duration-300 ${isCartOpen ? "visible" : "invisible"}`}>
      <button
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isCartOpen ? "opacity-100" : "opacity-0"
          }`}
        onClick={() => setCartOpen(false)}
        aria-label="Sluit winkelmand"
      />
      <div
        className={`absolute top-0 right-0 h-full w-full lg:w-150 bg-white shadow-lg transition-transform duration-300 ${isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full font-sans">
          <div className="flex justify-between items-center border-b border-[#E9E9E9] p-4 bg-[#F7F7F7]">
            <p className="text-lg font-medium text-[#1C2530]">Winkelmand</p>
            <button onClick={() => setCartOpen(false)} aria-label="Sluit winkelmand" className="text-2xl font-bold leading-none hover:text-gray-600 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 mb-8">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-16 text-gray-300 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <p className="text-gray-500 font-medium">Je winkelwagen is leeg</p>
                <button onClick={() => setCartOpen(false)} className="mt-4 text-[#0066FF] font-semibold hover:underline">Verder winkelen</button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-2 items-center justify-between p-3 mb-3 border border-[#DEDEDE] rounded-sm relative flex-col lg:flex-row">
                  <div className="flex items-center gap-4 justify-start w-full">
                    {item.slug ? (
                      <Link className="w-1/3 flex items-center justify-start" href={`/${item.slug}`} onClick={() => setCartOpen(false)}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-28 h-28 object-cover rounded bg-gray-100 cursor-pointer hover:opacity-80 transition" />
                        ) : (
                          <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="w-1/3 flex items-center justify-start">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-28 h-28 object-cover rounded bg-gray-100 cursor-pointer hover:opacity-80 transition" />
                        ) : (
                          <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="w-2/3">
                      {item.slug ? (
                        <Link href={`/${item.slug}`} className="hover:text-blue-600 transition" onClick={() => setCartOpen(false)}>
                          <h3 className="font-semibold">{item.name}</h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold">{item.name}</h3>
                      )}
                      {(item.color || item.brand || item.model) && (
                        <div className="flex gap-2 flex-wrap mt-1 mb-2">
                          {item.color && <p className="text-sm text-gray-600 border-r border-[#E6E6E6] pr-2 last:border-0 last:pr-0">Color: {item.color}</p>}
                          {item.brand && <p className="text-sm text-gray-600 border-r border-[#E6E6E6] pr-2 last:border-0 last:pr-0">Brand: {item.brand}</p>}
                          {item.model && <p className="text-sm text-gray-600 border-r border-[#E6E6E6] pr-2 last:border-0 last:pr-0">Model: {item.model}</p>}
                        </div>
                      )}
                      {isFetchingStock ? (
                        <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mt-1" />
                      ) : (
                        (() => {
                          // If we have baked-in text AND calculated text, which one to use?
                          // We prefer to re-calculate if we have stock info.
                          // If deliveryText is undefined (cleared by sync), we calculate.

                          // Check if calculations needed
                          let message = item.deliveryText;
                          let type = item.deliveryType;

                          if (!message || isCartOpen) { // Force recalc on open if we have data?
                            // Actually better to always recalc if possible using latest stock data
                            const info = getDeliveryInfo(
                              item.stockStatus || 'instock',
                              item.quantity,
                              item.stockQuantity !== undefined ? item.stockQuantity : null,
                              item.leadTimeInStock || 1,
                              item.leadTimeNoStock || 30
                            );
                            message = info.short;
                            type = info.type;
                          }

                          let colorClass = "text-[#03B955]";
                          if (type === "PARTIAL_STOCK") colorClass = "text-[#B28900]";
                          else if (type === "BACKORDER" || type === "OUT_OF_STOCK") colorClass = "text-[#FF5E00]";
                          return <p className={`${colorClass} text-xs font-semibold mt-1`}>{message}</p>;
                        })()
                      )}
                      {item.isMaatwerk && (
                        <div className="flex items-start gap-1 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-amber-600 flex-shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                          <p className="text-xs text-amber-700 font-medium leading-tight">Let op: maatwerk product. Uitgesloten van retourrecht</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex w-full lg:w-auto flex-row-reverse lg:flex-col items-center lg:items-end gap-2">
                    <div className="flex items-center border border-[#EDEDED] shadow-xs rounded-sm w-auto">
                      <button onClick={() => decreaseQuantity(item.id)} aria-label={`${item.name} aantal verlagen`} className="border-r border-[#EDEDED] cursor-pointer px-3 py-1 text-lg font-bold text-gray-700 hover:bg-gray-200">−</button>
                      <input type="number" min={1} aria-label="Aantal" className="w-14 text-center px-2 py-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={item.quantity} onChange={(e) => useCartStore.getState().updateQty(item.id, Math.max(1, parseInt(e.target.value) || 1))} />
                      <button onClick={() => increaseQuantity(item.id)} aria-label={`${item.name} aantal verhogen`} className="border-l border-[#EDEDED] cursor-pointer px-3 py-1 text-lg font-bold text-gray-700 hover:bg-gray-200">+</button>
                    </div>
                    <span className="font-bold text-lg flex flex-col">
                      €{((isB2B ? item.price : item.price * 1.21) * item.quantity).toFixed(2)} <span className="text-xs font-normal text-gray-500">{taxLabel}</span>
                    </span>
                    <button onClick={() => removeItem(item.id)} aria-label={`${item.name} verwijderen uit winkelmand`} className="text-red-600 hover:text-red-800 cursor-pointer bg-[#FFEAEB] rounded-full p-1 absolute -top-2 -right-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {items.length > 0 && (
            <div className="border-t border-[#E9E9E9] pt-6 mt-6 sticky bottom-1 bg-white p-4">
              <div className="flex justify-between mb-3 text-base font-medium text-[#3D4752]">
                <span>Subtotaal</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-3 text-base font-medium text-[#3D4752]">
                <span>Verzendkosten</span>
                <span>{isFreeShipping ? "Gratis" : displayShipping === 0 ? "N.t.b." : `€${displayShipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between mb-4 text-base">
                <p className="font-bold">Totaalbedrag<span className="font-normal text-xs ml-1.5">{taxLabel}</span></p>
                <span className="font-bold">€{(subtotal + displayShipping).toFixed(2)}</span>
              </div>
              {isB2B && (
                <div className="flex justify-between mb-4 text-sm text-gray-500">
                  <span>Totaal (incl. BTW)</span>
                  <span>€{((subtotal + shipping) * 1.21).toFixed(2)}</span>
                </div>
              )}
              <Link href="/checkout" onClick={() => setCartOpen(false)} className="w-full bg-[#0066FF] text-white font-bold px-4 py-3.5 rounded-sm text-base text-center block">
                Afrekenen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
