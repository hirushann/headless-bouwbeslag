"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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
      {categories.filter(cat => cat.parent === 0).map((cat) => (
        <motion.div 
          key={cat.id} 
          variants={item}
          className="border border-[#DBE3EA] rounded-sm p-4 shadow-[0px_20px_24px_0px_#0000000A] bg-white flex flex-col overflow-hidden"
        >
          <div className="relative h-40 w-full">
            <Link href={`/categories/${cat.slug}`} className="block w-full h-full">
              {cat.image ? (
                <Image src={cat.image.src} alt={cat.name} fill className="object-cover rounded-sm" />
              ) : (
                <div className="bg-gray-200 h-full w-full rounded-sm" />
              )}
            </Link>
          </div>
          <div className="flex flex-col mt-3">
            <Link href={`/categories/${cat.slug}`} className="hover:underline">
              <p className="text-[#1C2530] font-semibold text-xl mb-3">{cat.name}</p>
            </Link>
            <Link
              href={`/categories/${cat.slug}`}
              className="mt-auto text-center border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold text-sm py-2 rounded-sm block"
            >
              Bekijk alle {cat.name}
            </Link>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
