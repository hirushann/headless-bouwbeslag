"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { getDeliveryInfo } from "@/lib/deliveryUtils";
import { useUserContext } from "@/context/UserContext";
import { checkStockAction } from "@/app/actions";
import toast from "react-hot-toast";

import { useProductAddedModal } from "@/context/ProductAddedModalContext";
import { fixImageSrc } from "@/lib/image-utils";

export default function ShopProductCard({ product }: { product: any }) {
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

  // console.log("Rendering ProductCard:", product.name, "ID:", product.id);

  // Title logic
  const productTitle = product?.meta_data?.find((m: any) => m.key === "description_bouwbeslag_title")?.value || product?.name || "Untitled Product";

  const [isAdding, setIsAdding] = useState(false);
  const { userRole } = useUserContext();
  const { openModal } = useProductAddedModal();

  const calculatePrice = () => {
    const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));
    const getMeta = (k: string) => product?.meta_data?.find((m: any) => m.key === k)?.value;

    const taxRate = 21;
    const taxMultiplier = 1 + (taxRate / 100);

    let sale = 0;

    if (isB2B) {
      if (product.regular_price) {
        sale = parseFloat(product.regular_price);
      } else if (product.price) {
        sale = parseFloat(product.price);
      }
    } else {
      sale = product.price ? parseFloat(product.price) : 0;
      const b2cKey = "crucial_data_b2b_and_b2c_sales_price_b2c";
      const acfPriceRaw = getMeta(b2cKey);
      if (acfPriceRaw && !isNaN(parseFloat(acfPriceRaw))) {
        sale = parseFloat(acfPriceRaw);
      }
    }

    const finalPrice = isB2B ? sale : (sale ? sale * taxMultiplier : 0);

    return {
      cartPrice: sale,
      displayPrice: finalPrice
    };
  };

  return (
    <div className="snap-start shrink-0 w-[100%] border border-[#E2E2E2] rounded-lg shadow-sm bg-[#F7F7F7] flex flex-col h-full">
      <Link href={`/${product.slug}`} className="relative h-32 lg:h-48 bg-white rounded-tl-lg rounded-tr-lg overflow-hidden">
        <Image src={fixImageSrc(product.images?.[0]?.src)} alt={productTitle} fill className="object-contain" />

        {/* Dynamic stock badge */}
        {/* {product.stock_status === "instock" ? (
                <span className="absolute top-2 left-2 bg-white border border-green-500 text-green-600 text-xs px-2 py-1 rounded-full">In stock</span>
            ) : (
                <span className="absolute top-2 left-2 bg-white border border-red-500 text-red-600 text-xs px-2 py-1 rounded-full">Out of stock</span>
            )} */}
      </Link>

      <div className="p-2 lg:p-4 flex flex-col flex-1">
        <Link href={`/${product.slug}`} className="text-base lg:text-lg font-medium mb-1 line-clamp-3 text-[#1C2530] min-h-[60px]">
          {productTitle}
        </Link>

        <div className="flex flex-col mb-2">
          {(() => {
            // const userRole = useUserContext().userRole; // Using from parent scope
            const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));

            // Helper
            const getMeta = (k: string) => product?.meta_data?.find((m: any) => m.key === k)?.value;

            // Logic from ProductPageClient
            const taxRate = 21;
            const taxMultiplier = 1 + (taxRate / 100);



            let sale = 0;

            if (isB2B) {
              // B2B: Use regular_price (Ex-VAT) directly, ignoring sale price or ACF overrides if possible
              if (product.regular_price) {
                sale = parseFloat(product.regular_price);
              } else if (product.price) {
                sale = parseFloat(product.price);
              }
            } else {
              // B2C: Standard logic (ACF or Price)
              sale = product.price ? parseFloat(product.price) : 0;
              const b2cKey = "crucial_data_b2b_and_b2c_sales_price_b2c";
              const acfPriceRaw = getMeta(b2cKey);
              if (acfPriceRaw && !isNaN(parseFloat(acfPriceRaw))) {
                sale = parseFloat(acfPriceRaw);
              }
            }

            const advisedRaw = getMeta("crucial_data_unit_price");
            const advised = advisedRaw && !isNaN(parseFloat(advisedRaw)) ? parseFloat(advisedRaw) : null;

            const finalPrice = isB2B ? sale : (sale ? sale * taxMultiplier : 0);
            const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";

            // Calculate advised display price (if it exists)
            let advisedDisplay: number | null = null;
            if (advised) {
              advisedDisplay = isB2B ? advised : advised * taxMultiplier;
            }

            // Fallback to standard WC regular/sale if ACF advised is missing but standard fields exist (optional, but good for safety)
            // But strictly following ProductPage logic:
            const showStrikeThrough = advisedDisplay !== null && finalPrice < advisedDisplay;

            return (
              <div className="flex flex-col items-start">
                {/* {showStrikeThrough && advisedDisplay !== null && (
                   <span className="text-gray-400 line-through text-xs font-normal">
                      {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(advisedDisplay)}
                   </span>
                 )} */}
                <div className="flex items-end gap-1 flex-wrap">
                  <span className="text-xl font-bold text-[#1C2530]">
                    {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(finalPrice)}
                  </span>
                  <span className="text-[10px] text-gray-500 mb-1">{taxLabel}</span>
                </div>
              </div>
            );
          })()}
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
            <p className={`${colorClass} text-xs font-semibold mb-3`}>
              {deliveryInfo.short}
            </p>
          );
        })()}

        <button
          disabled={isAdding}
          onClick={async () => {
            if (isAdding) return;
            setIsAdding(true);

            try {
              // 1. Fetch real-time stock
              const stockRes = await checkStockAction(product.id);

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

              const { cartPrice, displayPrice } = calculatePrice();
              const deliveryInfo = getDeliveryInfo(stockData.stock_status, 1, stockData.stock_quantity ?? null);
              console.log(stockData);
              const getMeta = (k: string) => product?.meta_data?.find((m: any) => m.key === k)?.value;
              const packageLengthRaw = getMeta("dimensions_package_length");
              const packageLengthUnit = getMeta("dimensions_package_length_unit");
              const packageLength = packageLengthRaw && !isNaN(parseFloat(packageLengthRaw)) ? parseFloat(packageLengthRaw) : 0;
              const hasLengthFreight =
                (packageLengthUnit === 'cm' && packageLength > 160) ||
                (packageLengthUnit === 'mm' && packageLength > 1600);

              addItem({
                id: product.id,
                name: customTitle,
                price: cartPrice,
                quantity: 1,
                image: product.images?.[0]?.src,
                deliveryText: deliveryInfo.short,
                deliveryType: deliveryInfo.type,
                hasLengthFreight
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
                deliveryType: deliveryInfo.type,
                hasLengthFreight
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
            <span>Checking...</span>
          ) : (
            <>
              <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg></span>
              <span>In winkelwagen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}