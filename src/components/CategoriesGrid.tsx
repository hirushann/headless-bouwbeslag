"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { fixImageSrc } from "@/lib/image-utils";

interface Category {
  id: number;
  name: string;
  image: { src: string } | null;
  parent: number;
  slug: string;
  count: number;
}

interface CategoriesGridProps {
  categories: Category[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function CategoriesGrid({ categories }: CategoriesGridProps) {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
    >
      {categories.filter(cat => cat.parent === 0).map((cat) => {
        const displayName = cat.name.includes(" > ") ? cat.name.split(" > ").pop()?.trim() : cat.name;
        // Handle both WooCommerce format ({ src: string }) and Empire format (string)
        const imgSrc = typeof cat.image === 'string' ? cat.image : cat.image?.src;
        
        return (
        <motion.div 
          key={cat.id} 
          variants={item}
          className="border border-[#DBE3EA] rounded-sm p-4 shadow-[0px_20px_24px_0px_#0000000A] bg-white flex flex-col overflow-hidden"
        >
          <div className="relative h-40 w-full">
            <Link prefetch={true} href={`/${cat.slug}`} className="block w-full h-full">
              {imgSrc ? (
                <Image src={fixImageSrc(imgSrc)} alt={displayName || 'Category'} fill className="object-cover rounded-sm" />
              ) : (
                <div className="bg-gray-200 h-full w-full rounded-sm flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                </div>
              )}
            </Link>
          </div>
          <div className="flex flex-col mt-3">
            <Link prefetch={true} href={`/${cat.slug}`} className="hover:underline">
              <p className="text-[#1C2530] font-semibold text-xl mb-3">{displayName}</p>
            </Link>
            <Link
              prefetch={true}
              href={`/${cat.slug}`}
              className="mt-auto text-center border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-sm py-2 rounded-sm block"
            >
              Bekijk alle {displayName}
            </Link>
          </div>
        </motion.div>
      )})}
    </motion.div>
  );
}
