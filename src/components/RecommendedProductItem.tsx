"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from "@/lib/cartStore";
import { getDeliveryInfo } from "@/lib/deliveryUtils";
import { checkStockAction } from "@/app/actions";
import toast from "react-hot-toast";
import { useUserContext } from "@/context/UserContext";
import { fixImageSrc } from "@/lib/image-utils";

export default function RecommendedProductItem({ item, onAddToCart }: { item: any, onAddToCart?: () => void }) {
    const { userRole, isLoading } = useUserContext();
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);

    // Image logic
    const getMeta = (key: string) => item.meta_data?.find((m: any) => m.key === key)?.value;
    
    // Static cache for media URLs to avoid redundant requests during the session
    const globalMediaCache = (global as any).mediaCache || ((global as any).mediaCache = {});

    const catImgMeta = getMeta("assets_cat_image") || getMeta("cat_image");
    const isNumericCatImg = typeof catImgMeta === "string" && /^\d+$/.test(catImgMeta);
    const isCached = isNumericCatImg && !!globalMediaCache[catImgMeta];

    const initialImgSrc = catImgMeta && catImgMeta.trim() !== ""
        ? (isNumericCatImg ? (isCached ? globalMediaCache[catImgMeta] : undefined) : catImgMeta)
        : item.images?.[0]?.src || item.images?.[0] || "";

    const [targetImgSrc, setTargetImgSrc] = useState<string | undefined>(initialImgSrc);
    const [isFetchingImg, setIsFetchingImg] = useState<boolean>(isNumericCatImg && !isCached);

    React.useEffect(() => {
        if (!catImgMeta || catImgMeta.trim() === "") {
            setTargetImgSrc(item.images?.[0]?.src || item.images?.[0] || "");
            setIsFetchingImg(false);
            return;
        }

        if (isNumericCatImg && !isCached) {
            const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl";
            setIsFetchingImg(true);
            const startTime = Date.now();

            fetch(`${WP_BASE}/wp-json/wp/v2/media/${catImgMeta}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.source_url) {
                        globalMediaCache[catImgMeta] = data.source_url;
                        setTargetImgSrc(data.source_url);
                    } else {
                        setTargetImgSrc(item.images?.[0]?.src || item.images?.[0] || "");
                    }
                })
                .catch(() => {
                    setTargetImgSrc(item.images?.[0]?.src || item.images?.[0] || "");
                })
                .finally(() => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed < 300) {
                        setTimeout(() => setIsFetchingImg(false), 300 - elapsed);
                    } else {
                        setIsFetchingImg(false);
                    }
                });
        } else {
            setTargetImgSrc(initialImgSrc);
            setIsFetchingImg(false);
        }
    }, [item.id, catImgMeta]);

    const mImg = fixImageSrc(targetImgSrc);

    // Price Logic
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

    const totalStockMeta = getMeta("crucial_data_total_stock");
    const stockQty = totalStockMeta !== undefined && totalStockMeta !== null && totalStockMeta !== "" 
      ? parseInt(totalStockMeta, 10) 
      : (typeof item.stock_quantity === "number" ? item.stock_quantity : null);

    const deliveryInfo = getDeliveryInfo(
        item.stock_status || 'instock',
        quantity,
        stockQty,
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
                image: targetImgSrc || item.images?.[0]?.src || item.images?.[0] || "",
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
            if (onAddToCart) {
                onAddToCart();
            } else {
                useCartStore.getState().setCartOpen(true);
            }

        } catch (err) {
            // console.error(err);
            toast.error("Er ging iets mis.");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-xl bg-white hover:border-blue-200 transition-all shadow-sm">
            {/* Image & Info */}
            <div className="flex gap-3 flex-1 min-w-0">
                {/* Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border border-gray-100 rounded-lg p-1 bg-white flex items-center justify-center overflow-hidden">
                    {isFetchingImg ? (
                        <div className="w-full h-full bg-gray-100 animate-pulse" />
                    ) : item.slug ? (
                        <Link prefetch={true} href={`/${item.slug}`} className="block w-full h-full">
                            {mImg ? <img src={mImg} alt={item.name} className="w-full h-full object-contain rounded-md" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>}
                        </Link>
                    ) : (
                        mImg ? <img src={mImg} alt={item.name} className="w-full h-full object-contain rounded-md" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between gap-2 items-start">
                        {item.slug ? (
                            <Link prefetch={true} href={`/${item.slug}`} className="hover:text-blue-600 transition-colors">
                                <h4 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</h4>
                            </Link>
                        ) : (
                            <h4 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</h4>
                        )}
                        <div className="text-right shrink-0">
                            {isLoading ? (
                                <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <div className="text-sm sm:text-base font-bold text-gray-900 whitespace-nowrap">€ {finalPrice.toFixed(2).replace('.', ',')}</div>
                                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium">{taxLabel}</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Delivery Notice */}
                    <div className="text-xs mt-1.5">
                        {deliveryInfo.type === 'IN_STOCK' ? (
                            <span className="text-[#03B955] font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#03B955]"></span>
                                {deliveryInfo.short}
                            </span>
                        ) : deliveryInfo.type === 'PARTIAL_STOCK' ? (
                            <span className="text-[#B28900] font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#B28900]"></span>
                                {deliveryInfo.short}
                            </span>
                        ) : (
                             <span className="text-[#FF5E00] font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E00]"></span>
                                {deliveryInfo.short}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 sm:mt-0 sm:self-center border-t sm:border-0 border-gray-100 pt-3 sm:pt-0">
                <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white h-9 shrink-0">
                    <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-2.5 text-lg leading-none cursor-pointer border-r border-gray-300 hover:bg-gray-50 text-gray-600"
                    >-</button>
                    <div className="w-8 flex items-center justify-center text-sm font-semibold text-gray-900">
                        {quantity}
                    </div>
                    <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-2.5 text-lg leading-none cursor-pointer border-l border-gray-300 hover:bg-gray-50 text-gray-600"
                    >+</button>
                </div>

                <button 
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`h-9 px-4 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 flex-1 sm:flex-none ${isAdding ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-[#0066FF] text-white hover:bg-blue-700'}`}
                >
                    {isAdding ? "Laden..." : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            In winkelwagen
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
