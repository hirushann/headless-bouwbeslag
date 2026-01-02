import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { getDeliveryInfo } from "@/lib/deliveryUtils";
import { checkStockAction } from "@/app/actions";
import toast from "react-hot-toast";
const WP_BASE: string =
  (process.env.NEXT_PUBLIC_WC_URL as string) ||
  (process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string) ||
  "";

function normalizeImageUrl(url?: string): string {
  if (!url) return "/default-fallback-image.png";
  // protocol-relative URLs
  if (url.startsWith("//")) return `https:${url}`;
  // relative path from WP site
  if (url.startsWith("/")) return `${WP_BASE}${url}`;
  // force https if base uses https but image is http
  if (WP_BASE.startsWith("https://") && url.startsWith("http://")) {
    return url.replace(/^http:\/\//, "https://");
  }
  return url;
}

import { useUserContext } from "@/context/UserContext";

export default function ProductCard({ product, userRole: propUserRole }: { product: any; userRole?: string[] | null }) {
  const { userRole: contextUserRole, isLoading } = useUserContext();
  const userRole = propUserRole || contextUserRole;

  // Format price safely (remove weird HTML entities)
  const cleanPrice = (price: string) =>
    price?.replace(/&#[0-9]+;|&[a-z]+;/gi, "").trim();

  // Dynamic Price Logic
  const getMeta = (key: string) => product?.meta_data?.find((m: any) => m.key === key)?.value;
  const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));
  const b2bKey = "crucial_data_b2b_and_b2c_sales_price_b2b";
  const b2cKey = "crucial_data_b2b_and_b2c_sales_price_b2c";
  
  // Default to standard product.price
  let sale = product.price ? parseFloat(product.price) : null;
  const startKey = isB2B ? b2bKey : b2cKey;
  const acfPriceRaw = getMeta(startKey);
  
  if (acfPriceRaw && !isNaN(parseFloat(acfPriceRaw))) {
      sale = parseFloat(acfPriceRaw);
  } else if (isB2B) {
     const b2cFallback = getMeta(b2cKey);
     if (b2cFallback && !isNaN(parseFloat(b2cFallback))) {
         sale = parseFloat(b2cFallback);
     }
  }

  // Use this calculated 'sale' price for everything
  const TAX_RATE = 21;
  const taxMultiplier = 1 + (TAX_RATE / 100);
  
  const finalPrice = sale !== null 
     ? (isB2B ? sale : sale * taxMultiplier) 
     : (product.price ? parseFloat(product.price) * (isB2B ? 1 : taxMultiplier) : null);
     
  const displayPrice = finalPrice !== null ? finalPrice.toFixed(2) : cleanPrice(product.price);
  const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";
  
  // Recalculate discount based on this new price vs regular/advised
  // Assuming regular_price is the 'advised' or standard price for comparison
  const regular = product.regular_price ? parseFloat(product.regular_price) : null;
  const discount =
    regular && sale && regular > sale
      ? Math.round(((regular - sale) / regular) * 100)
      : null;

  const addItem = useCartStore((state) => state.addItem);

  // console.log("Rendering ProductCard:", product.name, "ID:", product.id);

  const rawImg: string | undefined = product.images?.[0]?.src;
  const imgSrc = normalizeImageUrl(rawImg);

  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="snap-start shrink-0 w-[100%] border border-[#E2E2E2] rounded-sm shadow-sm bg-[#F7F7F7] flex flex-col h-full">
      <Link href={`/${product.slug}`} className="relative h-32 lg:h-48 bg-white rounded-tl-lg rounded-tr-lg overflow-hidden">
        <Image src={imgSrc} alt={product.name || "Product image"} fill className="object-contain"/>

        {/* Dynamic stock badge */}
        {/* {product.stock_status === "instock" ? (
            <span className="absolute top-2 left-2 bg-white border border-green-500 text-green-600 text-xs px-2 py-1 rounded-full">In stock</span>
        ) : (
            <span className="absolute top-2 left-2 bg-white border border-red-500 text-red-600 text-xs px-2 py-1 rounded-full">Out of stock</span>
        )} */}
      </Link>

      <div className="p-2 lg:p-4 flex flex-col flex-1">
        <Link href={`/${product.slug}`} className="text-base lg:text-lg font-medium mb-1 line-clamp-2 text-[#1C2530]">
          {product.name || "Untitled Product"}
        </Link>

        {/* Brand / first attribute */}
        {/* {product.attributes?.length > 0 && (
          <p className="text-xs text-gray-500 mb-1">
            {product.attributes[0]?.options?.[0]}
          </p>
        )} */}

        <div className="flex items-center gap-2 mb-2">
          {isLoading ? (
             <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
          ) : (
             <>
                <p className="text-2xl font-bold text-[#1C2530]">
                    €{displayPrice} <span className="text-xs font-normal text-gray-500">{taxLabel}</span>
                </p>
                {/* {discount && (
                    <>
                    <span className="text-base line-through text-[#1C2530] font-normal">
                        €{product.regular_price}
                    </span>
                    <span className="bg-[#FF9800] text-white text-xs px-2 py-0.5 font-bold">
                        {discount}% off
                    </span>
                    </>
                )} */}
             </>
          )}
        </div>

        <span className="text-xs text-[#B7B7B7] mb-3 font-normal">
          {product.type?.toUpperCase() || "SET"}
        </span>

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
               addItem({
                  id: product.id,
                  name: product.name,
                  price: sale !== null ? sale : Number(product.regular_price || product.price || 0),
                  quantity: 1,
                  image: product.images?.[0]?.src,
                  deliveryText: getDeliveryInfo(product.stock_status, 1, product.stock_quantity ?? null).short,
                  deliveryType: getDeliveryInfo(product.stock_status, 1, product.stock_quantity ?? null).type,
                  slug: product.slug,
               });
               toast.success("Product toegevoegd aan winkelwagen!");

            } catch (err) {
               console.error(err);
               toast.error("Er ging iets mis. Probeer het opnieuw.");
            } finally {
               setIsAdding(false);
            }
          }}
          className={`mt-auto text-center py-3 rounded-md transition flex items-center justify-center gap-2 font-semibold ${isAdding ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
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