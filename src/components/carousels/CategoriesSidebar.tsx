"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
}

interface CategoriesSidebarProps {
  categories: Category[];
}

export default function CategoriesSidebar({ categories }: CategoriesSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
     className="bg-[#FFFFFF] shadow-[0px_20px_24px_0px_#0000000A] rounded-[4px] w-[27%] hidden lg:block">
        <div className="border-b border-[#F1F1F1] flex items-center p-5">
            <p className="font-bold text-[22px]">All Categories</p>
        </div>

      {(Array.isArray(categories) ? categories : []).filter((cat) => cat.parent === 0) .map((cat) => { const subs = (Array.isArray(categories) ? categories : []).filter((s) => s.parent === cat.id);
          return subs.length > 0 ? (
            <div key={cat.id} className="collapse collapse-arrow !rounded-0">
              <input type="checkbox" />
              <div className="collapse-title font-normal text-sm text-[#3D4752] py-3">{cat.name}</div>
              <div className="collapse-content text-sm">
                <ul>
                  {subs.map((sub) => (
                    <li key={sub.id}>
                      <Link href={`/categories/${sub.slug}`} className="hover:underline cursor-pointer text-[#0066FF]">
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className="block font-normal text-sm text-[#3D4752] py-3 px-4 hover:underline">
              {cat.name}
            </Link>
          );
        })}
    </motion.div>
  );
}