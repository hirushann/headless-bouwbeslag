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

    const [quantity, setQuantity] = useState(1);

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
    // Calculate total price based on quantity
    const TAX_RATE = 21;
    const taxMultiplier = 1 + (TAX_RATE / 100);
    const unitPrice = sale ? (isB2B ? sale : sale * taxMultiplier) : 0;
    const finalPrice = unitPrice * quantity;
    const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";

    // Delivery Info Logic
    const stockLeadRaw = getMeta("crucial_data_delivery_if_stock");
    const noStockLeadRaw = getMeta("crucial_data_delivery_if_no_stock");
    const leadTimeInStock = stockLeadRaw && !isNaN(parseInt(stockLeadRaw)) ? parseInt(stockLeadRaw) : 1;
    const leadTimeNoStock = noStockLeadRaw && !isNaN(parseInt(noStockLeadRaw)) ? parseInt(noStockLeadRaw) : 30;

    const deliveryInfo = getDeliveryInfo(
        item.stock_status || 'instock',
        quantity,
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

            // 3. Validate Quantity
            if (manage_stock && typeof stock_quantity === "number" && !isBackorderAllowed && quantity > stock_quantity) {
               toast.error(`Niet op voorraad. Maximaal beschikbaar: ${stock_quantity}`);
               return;
            }

            // 4. Success - Add to Cart
            useCartStore.getState().addItem({
                id: item.id,
                name: item.name,
                price: sale, // Use the Ex-VAT 'sale' price base
                quantity: quantity,
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
        <div className="flex flex-row gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-white hover:border-blue-200 transition-colors">
            {/* Image */}
            <div className="w-28 h-28 lg:w-16 lg:h-16 bg-white rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                {item.slug ? (
                    <Link href={`/${item.slug}`} className="block w-full h-full">
                        {mImg ? <img src={mImg} alt={item.name} className="w-full h-full object-cover rounded-md" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>}
                    </Link>
                ) : (
                    mImg ? <img src={mImg} alt={item.name} className="w-full h-full object-cover rounded-md" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col lg:flex-row justify-between">
                <div className="flex justify-center items-start flex-col w-full">
                    <div className='max-w-[70%]'>
                        {item.slug ? (
                            <Link href={`/${item.slug}`} className="hover:text-blue-600 transition-colors">
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                            </Link>
                        ) : (
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                        )}
                    </div>
                    <div className="flex gap-2.5 items-center">
                        {isLoading ? (
                            <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                            <>
                                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">€ {finalPrice.toFixed(2).replace('.', ',')}</span>
                                <div className="text-xs text-gray-500 font-normal">{taxLabel}</div>
                            </>
                        )}
                    </div>
                    {/* Delivery Notice */}
                    <div className="text-xs w-full lg:w-auto mb-2 lg:mb-0">
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
                </div>

                <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                    

                    <div className="flex items-center gap-2 lg:ml-auto flex-col items-start lg:items-end">
                        {/* Quantity Selector */}
                        <div className="flex border border-gray-300 rounded-sm overflow-hidden bg-white h-8">
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="px-2 text-lg leading-none cursor-pointer border-r border-gray-300 hover:bg-gray-50 text-gray-600"
                            >-</button>
                            <div className="w-8 flex items-center justify-center text-sm font-medium text-gray-900">
                                {quantity}
                            </div>
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => q + 1)}
                                className="px-2 text-lg leading-none cursor-pointer border-l border-gray-300 hover:bg-gray-50 text-gray-600"
                            >+</button>
                        </div>

                        {/* Add to Cart Button */}
                        <button 
                            onClick={handleAddToCart}
                            disabled={isAdding}
                            className={`h-8 px-3 rounded-sm text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${isAdding ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-[#0066FF] text-white hover:bg-blue-700'}`}
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
        </div>
    );
}
