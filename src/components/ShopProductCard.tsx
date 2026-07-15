"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { getDeliveryInfo } from "@/lib/deliveryUtils";
import { useUserContext } from "@/context/UserContext";
import { checkStockAction } from "@/app/actions";
import toast from "react-hot-toast";

import { useProductAddedModal } from "@/context/ProductAddedModalContext";
import { fixImageSrc } from "@/lib/image-utils";

const globalMediaCache: Record<string, string> = {};

export default function ShopProductCard({ product, useCategoryImage = false }: { product: any; useCategoryImage?: boolean }) {
  // Format price safely (remove weird HTML entities)
  const cleanPrice = (price: string) =>
    price?.replace(/&#[0-9]+;|&[a-z]+;/gi, "").trim();

  const discount =
    product.regular_price && product.sale_price
      ? Math.round(
        ((parseFloat(product.regular_price) -
          parseFloat(product.sale_price)) /
          parseFloat(product.regular_price)) *
        100
      )
      : null;

  const addItem = useCartStore((state) => state.addItem);

  // Title logic
  const productTitle = product?.meta_data?.find((m: any) => m.key === "description_bouwbeslag_title")?.value || product?.name || "Untitled Product";

  const [isAdding, setIsAdding] = useState(false);

  // Pre-calculate image state to avoid flash
  const catImgMetaRaw = useCategoryImage 
    ? (product?.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value || 
       product?.meta_data?.find((m: any) => m.key === "cat_image")?.value)
    : null;

  const catImgMeta = catImgMetaRaw ? String(catImgMetaRaw) : null;
  const isNumericCatImg = typeof catImgMeta === "string" && /^\d+$/.test(catImgMeta);
  const isCached = isNumericCatImg && !!globalMediaCache[catImgMeta as string];
  
  const resolvedCatImage = useCategoryImage ? product.resolved_cat_image : null;

  // Best non-category product image: prefer typed 'cat_image', then 'main_picture', else first image, else main_image_url
  const getProductImageSrc = () => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const catImage = product.images.find((img: any) => img.type === "cat_image");
      if (catImage) return catImage.url || catImage.src;

      const mainPic = product.images.find((img: any) => img.type === "main_picture");
      return (mainPic?.url || mainPic?.src) || (product.images[0]?.url || product.images[0]?.src);
    }
    return product.main_image_url || undefined;
  };
  
  const initialImgSrc = resolvedCatImage || (catImgMeta && catImgMeta.trim() !== ""
      ? (isNumericCatImg ? (isCached ? globalMediaCache[catImgMeta as string] : undefined) : catImgMeta)
      : getProductImageSrc());

  const [targetImgSrc, setTargetImgSrc] = useState<string | undefined>(initialImgSrc);
  const [isFetchingImg, setIsFetchingImg] = useState<boolean>(!resolvedCatImage && isNumericCatImg && !isCached);

  useEffect(() => {
    // If we have it from server already, don't do anything
    if (resolvedCatImage) {
        setTargetImgSrc(resolvedCatImage);
        setIsFetchingImg(false);
        return;
    }

    // Reset to fallback if no cat image meta exists
    if (!catImgMeta || catImgMeta.trim() === "") {
        setTargetImgSrc(getProductImageSrc());
        setIsFetchingImg(false);
        return;
    }

    // Check if we need to fetch a numeric media reference
    if (isNumericCatImg && !isCached) {
      const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl";
      
      setIsFetchingImg(true);
      
      const startTime = Date.now();
      fetch(`${WP_BASE}/wp-json/wp/v2/media/${catImgMeta}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.source_url) {
            globalMediaCache[catImgMeta as string] = data.source_url;
            setTargetImgSrc(data.source_url);
          } else {
            setTargetImgSrc(getProductImageSrc());
          }
        })
        .catch((e) => {
          setTargetImgSrc(getProductImageSrc());
        })
        .finally(() => {
            // Ensure at least a small delay to avoid flicker if it was too fast
            const elapsed = Date.now() - startTime;
            if (elapsed < 300) {
              setTimeout(() => setIsFetchingImg(false), 300 - elapsed);
            } else {
              setIsFetchingImg(false);
            }
        });
    } else {
      // If cached or a direct URL, use it immediately
      setTargetImgSrc(initialImgSrc);
      setIsFetchingImg(false);
    }
  }, [product?.id, catImgMeta]);

  const { userRole, isB2B } = useUserContext();
  const { openModal } = useProductAddedModal();

  

  // Unified pricing logic
  const priceData = (() => {
    const getMeta = (k: string) => product?.meta_data?.find((m: any) => m.key === k)?.value;
    const taxRate = 21;
    const taxMultiplier = 1 + (taxRate / 100);

    let sale = 0;

    if (isB2B) {
      const b2bPrice = product.price_b2b;
      if (b2bPrice && typeof b2bPrice === 'object' && b2bPrice.amount) {
        sale = parseFloat(b2bPrice.amount);
      } else if (b2bPrice && !isNaN(parseFloat(b2bPrice))) {
        sale = parseFloat(b2bPrice);
      } else if (product.price) {
        sale = parseFloat(product.price);
      }
    } else {
      const b2cPrice = product.price_b2c;
      if (b2cPrice && typeof b2cPrice === 'object' && b2cPrice.amount) {
        sale = parseFloat(b2cPrice.amount);
      } else if (b2cPrice && !isNaN(parseFloat(b2cPrice))) {
        sale = parseFloat(b2cPrice);
      } else if (product.price) {
        sale = parseFloat(product.price);
      }
    }

    const finalPrice = isB2B ? sale : (sale ? sale * taxMultiplier : 0);
    const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";

    const advisedRaw = getMeta("crucial_data_unit_price");
    const advised = advisedRaw && !isNaN(parseFloat(advisedRaw)) ? parseFloat(advisedRaw) : null;

    let advisedDisplay: number | null = null;
    if (advised) {
      advisedDisplay = isB2B ? advised : advised * taxMultiplier;
    }

    const showStrikeThrough = advisedDisplay !== null && finalPrice < advisedDisplay;

    return {
      cartPrice: sale,
      displayPrice: finalPrice,
      finalPrice,
      taxLabel,
      advisedDisplay,
      showStrikeThrough
    };
  })();

  return (
    <div className="snap-start shrink-0 w-[100%] border border-[#E2E2E2] rounded-lg shadow-sm bg-[#F7F7F7] flex flex-col h-full">
      <Link href={`/${product.slug}`} className="relative h-32 lg:h-48 bg-white rounded-tl-lg rounded-tr-lg overflow-hidden flex items-center justify-center">
        {isFetchingImg ? (
          <div className="w-full h-full bg-gray-100 animate-pulse" />
        ) : targetImgSrc ? (
          <Image 
            src={fixImageSrc(targetImgSrc)} 
            alt={productTitle} 
            fill
            sizes="(max-width: 768px) 150px, 300px"
            className="object-contain p-2" 
            onError={() => {
              const fallbackSrc = getProductImageSrc();
              const fallback = fallbackSrc || "/default-fallback-image.webp";
              if (targetImgSrc !== fallback && !targetImgSrc.includes("default-fallback-image.webp")) {
                setTargetImgSrc(fallback);
              }
            }}
          />
        ) : (
          <Image 
            src="/default-fallback-image.webp" 
            alt={productTitle} 
            fill
            sizes="(max-width: 768px) 150px, 300px"
            className="object-contain p-2 opacity-50" 
          />
        )}

        {/* Dynamic stock badge */}
        {/* {product.stock_status === "instock" ? (
                <span className="absolute top-2 left-2 bg-white border border-green-500 text-green-600 text-xs px-2 py-1 rounded-full">In stock</span>
            ) : (
                <span className="absolute top-2 left-2 bg-white border border-red-500 text-red-600 text-xs px-2 py-1 rounded-full">Out of stock</span>
            )} */}
      </Link>

      <div className="p-2 lg:p-4 flex flex-col flex-1">
        <Link href={`/${product.slug}`} className="text-sm md:text-base lg:text-lg font-medium mb-1 line-clamp-3 text-[#1C2530] min-h-[60px] lg:min-h-[65px]">
          {productTitle}
        </Link>

        <div className="mt-auto mb-2">
          <div className="flex flex-col mb-2">
            {/* Price Display */}
            <div className="flex flex-col items-start">
              {/* {priceData.showStrikeThrough && priceData.advisedDisplay !== null && (
                    <span className="text-gray-400 line-through text-xs font-normal">
                        {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(priceData.advisedDisplay)}
                    </span>
                  )} */}
              <div className="flex items-end gap-1 flex-wrap">
                <span className="text-base lg:text-xl font-bold text-[#1C2530]">
                  {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(priceData.finalPrice)}
                </span>
                <span className="text-[10px] text-gray-500 mb-1">{priceData.taxLabel}</span>
              </div>
            </div>
          </div>

          {(() => {
            const getMeta = (key: string) => product?.meta_data?.find((m: any) => m.key === key)?.value;

            // 1. Extract Lead Times (Defaults: 1 if stock, 30 if no stock)
            const stockLeadRaw = getMeta("crucial_data_delivery_if_stock");
            const noStockLeadRaw = getMeta("crucial_data_delivery_if_no_stock");
            const leadTimeInStock = stockLeadRaw && !isNaN(parseInt(stockLeadRaw)) ? parseInt(stockLeadRaw) : 1;
            const leadTimeNoStock = noStockLeadRaw && !isNaN(parseInt(noStockLeadRaw)) ? parseInt(noStockLeadRaw) : 30;

            // 2. Extract Adjusted Total Stock (ACF Priority)
            const totalStockMeta = getMeta("crucial_data_total_stock");
            const stockQty = totalStockMeta !== undefined && totalStockMeta !== null && totalStockMeta !== "" 
              ? parseInt(totalStockMeta, 10) 
              : (typeof product.stock_quantity === "number" ? product.stock_quantity : null);

            // 3. Get Delivery Info
            const deliveryInfo = getDeliveryInfo(
              product.stock_status, 
              1, 
              stockQty,
              leadTimeInStock,
              leadTimeNoStock
            );

            // Determine color based on type (matching ProductPage/Cart logic)
            let colorClass = "text-[#03B955]"; // Green (In stock)
            if (deliveryInfo.type === "PARTIAL_STOCK") colorClass = "text-[#B28900]"; // Amber
            else if (deliveryInfo.type === "BACKORDER" || deliveryInfo.type === "OUT_OF_STOCK") colorClass = "text-[#FF5E00]"; // Orange/Red

            return (
              <p className={`${colorClass} text-xs font-semibold`}>
                {deliveryInfo.short}
              </p>
            );
          })()}
        </div>

        <button
          disabled={isAdding}
          onClick={async () => {
            if (isAdding) return;
            setIsAdding(true);

            try {
              // 1. Fetch real-time stock using the most reliable identifier (SKU > ID)
              const identifier = (product.sku && product.sku.trim() !== "") ? product.sku : product.id;
              const stockRes = await checkStockAction(identifier);

              if (!stockRes.success || !stockRes.data) {
                toast.error(stockRes.error || "Fout bij ophalen voorraad.");
                setIsAdding(false);
                return;
              }

              const stockData = stockRes.data;

              const { stock_status, stock_quantity, manage_stock, backorders, backorders_allowed } = stockData;
              const isBackorderAllowed = backorders === "yes" || backorders === "notify" || backorders_allowed === true;

              // 2. Validate Stock Status
              if (stock_status !== "instock" && stock_status !== "onbackorder" && !isBackorderAllowed) {
                toast.error("Dit product is momenteel niet op voorraad.");
                setIsAdding(false);
                return;
              }

              // 3. Validate Quantity (we are adding 1)
              if (manage_stock && typeof stock_quantity === "number" && !isBackorderAllowed && 1 > stock_quantity) {
                toast.error(`Niet op voorraad. Maximaal beschikbaar: ${stock_quantity}`);
                setIsAdding(false);
                return;
              }

              // 4. Success - Add to Cart
              const customTitle = product?.meta_data?.find((m: any) => m.key === "description_bouwbeslag_title")?.value || product.name;

              const { cartPrice, displayPrice } = priceData;
              const deliveryInfo = getDeliveryInfo(stockData.stock_status, 1, stockData.stock_quantity ?? null);
              const cartItemId = Number(stockData.id || product.id);
              addItem({
                id: cartItemId,
                name: customTitle,
                price: cartPrice,
                quantity: 1,
                image: targetImgSrc || product.images?.[0]?.src,
                deliveryText: deliveryInfo.short,
                deliveryType: deliveryInfo.type,
                slug: product.slug,
                sku: stockData.sku || product.sku
              });

              openModal({
                product,
                quantity: 1,
                totalPrice: displayPrice,
                currency: product.currency_symbol || "€",
                userRole: userRole || undefined,
                musthaveprodKeys: [],
                matchingProducts: [],
                matchingKnobroseKeys: [],
                matchingRoseKeys: [],
                pcroseKeys: [],
                blindtoiletroseKeys: [],
                deliveryText: deliveryInfo.short,
                deliveryType: deliveryInfo.type
              });

            } catch (err) {
              //  console.error(err);
              toast.error("Er ging iets mis. Probeer het opnieuw.");
            } finally {
              setIsAdding(false);
            }
          }}
          className={`mt-auto text-center py-2 rounded-sm transition flex items-center justify-center gap-2 font-semibold text-sm ${isAdding ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {isAdding ? (
            <span>Controleren...</span>
          ) : (
            <>
              <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 lg:size-6" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg></span>
              <span>In winkelwagen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
