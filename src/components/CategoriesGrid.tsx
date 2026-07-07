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
              <Image 
                src={fixImageSrc(imgSrc)} 
                alt={displayName || 'Category'} 
                fill 
                className="object-cover rounded-sm" 
                onError={(e) => {
                  e.currentTarget.srcset = "";
                  e.currentTarget.src = "/default-fallback-image.webp";
                }}
              />
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
