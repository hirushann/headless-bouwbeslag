"use client";
import Image from "next/image";
import { useCartStore } from "@/lib/cartStore";

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

  console.log("Rendering ProductCard:", product.name, "ID:", product.id);

  return (
    <div className="snap-start shrink-0 w-[100%] border border-[#E2E2E2] rounded-lg shadow-sm bg-[#F7F7F7] flex flex-col h-full">
        <div className="relative h-48 bg-white rounded-tl-lg rounded-tr-lg overflow-hidden">
            <Image src={product.images?.[0]?.src || "/placeholder.png"} alt={product.name || "Product image"} fill className="object-contain"/>
        </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-medium mb-1 line-clamp-2 text-[#1C2530]">
          {product.name || "Untitled Product"}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <p className="text-xl font-bold text-[#1C2530]">
            €{cleanPrice(product.price)}
          </p>
          <p className="text-[#03B955] text-sm font-normal">Delivery in 3 days</p>
        </div>

        <span className="text-xs text-[#B7B7B7] mb-3 font-normal">
          {product.type?.toUpperCase() || "SET"}
        </span>

        <button
          onClick={() => {
            console.log("Adding to cart:", product.name, "ID:", product.id);
            addItem({
              id: product.id,
              name: product.name,
              price: Number(product.sale_price || product.regular_price || product.price || 0),
              quantity: 1,
              image: product.images?.[0]?.src,
            });
          }}
          className="mt-auto text-center bg-blue-600 text-white py-2 rounded-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold text-sm"
        >
          <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg></span>
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}