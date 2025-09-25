"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";

import Link from "next/link";
import api from "@/lib/woocommerce";

interface Category {
  id: number;
  name: string;
  image: { src: string } | null;
  parent: number;
  slug: string;
  count: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get("products/categories", { per_page: 50 }).then((response) => {
      setCategories(response.data);
    });
  }, []);

  return (
    <main className="font-sans bg-[#F7F7F7]">
        <div className="max-w-[1440px] mx-auto px-1 py-10 ">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
                <Link href="/" className="hover:underline flex items-center gap-1 text-black">
                <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg></span>
                <span>Home</span>
                </Link>{" "}
                / All categories
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-bold text-[#1C2530] mb-2">Shop categories</h1>
            <p className="text-gray-600 mb-8 text-sm font-normal">
                Check all our categories to get what you needs
            </p>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {categories.filter(cat => cat.parent === 0).map((cat) => (
                <div key={cat.id} className="border border-[#DBE3EA] rounded-sm p-4 shadow-[0px_20px_24px_0px_#0000000A] bg-white flex flex-col overflow-hidden">
                    <div className="relative h-40 w-full">
                    {cat.image ? (
                      <Image src={cat.image.src} alt={cat.name} fill className="object-cover rounded-sm" />
                    ) : (
                      <div className="bg-gray-200 h-full w-full rounded-sm" />
                    )}
                    </div>
                    <div className="flex flex-col mt-3">
                    <h3 className="text-[#1C2530] font-semibold text-xl mb-3">{cat.name}</h3>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="mt-auto text-center border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-sm py-2 rounded-sm block"
                    >
                      View all {cat.name}
                    </Link>
                    </div>
                </div>
                ))}
            </div>
        </div>
        <div className="bg-white py-5">
            <div className="max-w-[1440px] mx-auto px-1">
                <div className="flex gap-6 items-center font-sans mb-4">
                    <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
                        <Image className="" src="/card1icon.png" alt="" width={48} height={48} />
                        <h2 className="text-[#1C2530] font-semibold text-lg">Guaranteed the cheapest</h2>
                        <p className="text-[#3D4752] font-normal text-sm">Find this product cheaper elsewhere? We'll match the price and give you an extra 10% discount.</p>
                    </div>
                    <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
                        <Image className="" src="/card2icon.png" alt="" width={48} height={48} />
                        <h2 className="text-[#1C2530] font-semibold text-lg">30-day return policy</h2>
                        <p className="text-[#3D4752] font-normal text-sm">Return your order within 30 days and you will receive a refund of the amount you paid.</p>
                    </div>
                    <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
                        <Image className="" src="/card3icon.png" alt="" width={48} height={48} />
                        <h2 className="text-[#1C2530] font-semibold text-lg">Pay safely and quickly</h2>
                        <p className="text-[#3D4752] font-normal text-sm">You can choose and pay for your preferred payment method via our PSP Mollie.</p>
                    </div>
                    <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
                        <Image className="" src="/card4icon.png" alt="" width={48} height={48} />
                        <h2 className="text-[#1C2530] font-semibold text-lg">Renowned brands</h2>
                        <p className="text-[#3D4752] font-normal text-sm">We sell renowned brands such as JNF, GPF, Mauer, Mi Satori, M&T, Zoo Hardware</p>
                    </div>
                </div>
            </div>
        </div>
    </main>
  );
}