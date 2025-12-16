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

const CategoryItem = ({ category, allCategories }: { category: Category; allCategories: Category[] }) => {
  const children = allCategories.filter((c) => c.parent === category.id);
  const hasChildren = children.length > 0;

  if (hasChildren) {
    return (
      <div className="collapse collapse-arrow !rounded-0 bg-transparent">
        <input type="checkbox" className="min-h-0 py-0" />
        <div className="collapse-title font-normal text-sm text-[#3D4752] py-3 min-h-0 flex items-center pr-4">
            <Link 
              href={`/categories/${category.slug}`} 
              className="hover:text-[#0066FF] hover:underline z-10 relative"
              onClick={(e) => e.stopPropagation()} 
            >
              {category.name}
            </Link>
        </div>
        <div className="collapse-content text-sm pl-4 !pb-0">
          <div className="border-l border-gray-200 pl-2">
            {children.map((child) => (
              <CategoryItem key={child.id} category={child} allCategories={allCategories} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="block font-normal text-sm text-[#3D4752] py-3 px-4 hover:text-[#0066FF] hover:underline"
    >
      {category.name}
    </Link>
  );
};

export default function CategoriesSidebar({ categories }: CategoriesSidebarProps) {
  // Only render top-level categories (parent === 0)
  // Recursive CategoryItem handles children
  const topLevelCategories = (Array.isArray(categories) ? categories : []).filter(
    (cat) => cat.parent === 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-[#FFFFFF] shadow-[0px_20px_24px_0px_#0000000A] rounded-[4px] w-[27%] hidden lg:flex flex-col lg:h-[80vh]"
    >
      <div className="border-b border-[#F1F1F1] flex items-center p-5 shrink-0">
        <p className="font-bold text-[22px]">Bekijk ons assortiment</p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {topLevelCategories.map((cat) => (
          <div key={cat.id} className="border-b border-[#F7F7F7] last:border-0">
             <CategoryItem category={cat} allCategories={categories} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}