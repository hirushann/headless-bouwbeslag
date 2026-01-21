"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from "@/lib/cartStore";
import { getDeliveryInfo } from "@/lib/deliveryUtils";
import { checkStockAction } from "@/app/actions";
import toast from "react-hot-toast";
import { useUserContext } from "@/context/UserContext";

export default function RecommendedProductItem({ item }: { item: any }) {
    const { userRole, isLoading } = useUserContext();
    const [isAdding, setIsAdding] = useState(false);

    // Price Logic
    const getMeta = (key: string) => item.meta_data?.find((m: any) => m.key === key)?.value;
    const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));
    const b2cKey = "crucial_data_b2b_and_b2c_sales_price_b2c";
    let sale = 0;

    if (isB2B) {
        if (item.regular_price) {
            sale = parseFloat(item.regular_price);
        } else if (item.price) {
            sale = parseFloat(item.price);
        }
    } else {
        // B2C Logic
        sale = item.price ? parseFloat(item.price) : 0;
        const acfPriceRaw = getMeta(b2cKey);
        if (acfPriceRaw && !isNaN(parseFloat(acfPriceRaw))) {
            sale = parseFloat(acfPriceRaw);
        }
    }

    const mImg = item.images?.[0]?.src || item.images?.[0] || "";
    const displayPrice = sale;
    const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";
    // If not B2B, we add tax for display if needed, but usually item.price is VAT inclusive for B2C if configured in Woo?
    // Checking ProductPageClient logic:
    // const taxRate = 21; // passed prop
    // const taxMultiplier = 1 + (taxRate / 100);
    // const finalPrice = isB2B ? sale : (sale ? sale * taxMultiplier : 0);
    // Wait, ProductPageClient receives taxRate prop. I don't have it here casually.
    // However, usually WooCommerce REST API returns prices based on settings.
    // In ProductPageClient, it calculates manually:
    // const finalPrice = isB2B ? sale : (sale ? sale * taxMultiplier : null);
    // I should attempt to replicate this. I'll default taxRate to 21 if not passed, or passed as prop.
    // For now I'll assume 21% or just show the price similarly to ProductCard.
    
    // ProductCard.tsx logic:
    // const TAX_RATE = 21;
    // const taxMultiplier = 1 + (TAX_RATE / 100);
    // const finalPrice = sale !== null ? (isB2B ? sale : sale * taxMultiplier) : ...
    
    const TAX_RATE = 21;
    const taxMultiplier = 1 + (TAX_RATE / 100);
    const finalPrice = sale ? (isB2B ? sale : sale * taxMultiplier) : 0;


    // Delivery Info Logic
    // Defaults: 1 day if stock, 30 days if no stock (from user request default)
    // We try to find these metadatas if they exist on the item
    const stockLeadRaw = getMeta("crucial_data_delivery_if_stock");
    const noStockLeadRaw = getMeta("crucial_data_delivery_if_no_stock");
    const leadTimeInStock = stockLeadRaw && !isNaN(parseInt(stockLeadRaw)) ? parseInt(stockLeadRaw) : 1;
    const leadTimeNoStock = noStockLeadRaw && !isNaN(parseInt(noStockLeadRaw)) ? parseInt(noStockLeadRaw) : 30;

    const deliveryInfo = getDeliveryInfo(
        item.stock_status || 'instock',
        1,
        item.stock_quantity ?? null,
        leadTimeInStock,
        leadTimeNoStock
    );

    const handleAddToCart = async () => {
        if (isAdding) return;
        setIsAdding(true);
        try {
            // 1. Fetch real-time stock
            const stockRes = await checkStockAction(item.id);
            if (!stockRes.success || !stockRes.data) {
                toast.error(stockRes.error || "Fout bij ophalen voorraad.");
                return;
            }
            const stockData = stockRes.data;
            const { stock_status, stock_quantity, manage_stock, backorders, backorders_allowed } = stockData;
            const isBackorderAllowed = backorders === "yes" || backorders === "notify" || backorders_allowed === true;

             // 2. Validate Stock Status
             if (stock_status !== "instock" && stock_status !== "onbackorder" && !isBackorderAllowed) {
                toast.error("Dit product is momenteel niet op voorraad.");
                return;
            }

            // 3. Validate Quantity (we are adding 1)
            if (manage_stock && typeof stock_quantity === "number" && !isBackorderAllowed && 1 > stock_quantity) {
               toast.error(`Niet op voorraad. Maximaal beschikbaar: ${stock_quantity}`);
               return;
            }

            // 4. Success - Add to Cart
            useCartStore.getState().addItem({
                id: item.id,
                name: item.name,
                price: sale, // Use the Ex-VAT 'sale' price base if B2B/B2C logic implies it, checking ProductPageClient:
                // ProductPageClient uses: price: cartBasePrice (which is 'sale')
                quantity: 1,
                image: mImg,
                deliveryText: deliveryInfo.short,
                deliveryType: deliveryInfo.type,
                slug: item.slug,
                stockStatus: stock_status,
                stockQuantity: stock_quantity ?? null,
                leadTimeInStock,
                leadTimeNoStock,
                isMaatwerk: getMeta("crucial_data_maatwerk") === "1"
            });
            toast.success("Product toegevoegd aan winkelwagen!");
            useCartStore.getState().setCartOpen(true);

        } catch (err) {
            console.error(err);
            toast.error("Er ging iets mis.");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-white hover:border-blue-200 transition-colors">
            {/* Image */}
            <div className="w-16 h-16 bg-white rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                {item.slug ? (
                    <Link href={`/${item.slug}`} className="block w-full h-full">
                        {mImg ? <img src={mImg} alt={item.name} className="w-full h-full object-cover rounded-md" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>}
                    </Link>
                ) : (
                    mImg ? <img src={mImg} alt={item.name} className="w-full h-full object-cover rounded-md" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className='max-w-[70%]'>
                        {item.slug ? (
                            <Link href={`/${item.slug}`} className="hover:text-blue-600 transition-colors">
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                            </Link>
                        ) : (
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                        )}
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                        {isLoading ? (
                            <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                            <>
                                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">€ {finalPrice.toFixed(2).replace('.', ',')}</span>
                                <div className="text-xs text-gray-500 font-normal">{taxLabel}</div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-end mt-2">
                    {/* Delivery Notice */}
                    <div className="text-xs">
                        {deliveryInfo.type === 'IN_STOCK' || deliveryInfo.type === 'PARTIAL_STOCK' ? (
                            <span className="text-[#03B955] font-medium flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#03B955]"></span>
                                {deliveryInfo.short}
                            </span>
                        ) : (
                             <span className="text-[#FF5E00] font-medium flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#FF5E00]"></span>
                                {deliveryInfo.short}
                            </span>
                        )}
                    </div>

                    {/* Add to Cart Button */}
                    <button 
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors flex items-center gap-1 ${isAdding ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-[#0066FF] text-white hover:bg-blue-700'}`}
                    >
                         {isAdding ? "Laden..." : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                In winkelwagen
                            </>
                         )}
                    </button>
                </div>
            </div>
        </div>
    );
}
