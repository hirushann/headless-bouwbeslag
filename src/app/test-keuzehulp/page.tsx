"use client";

import React, { useState, useEffect } from "react";
import KeuzehulpModal from "@/components/KeuzehulpModal";
import ProductCard from "@/components/ProductCard";

export default function KeuzehulpDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collectedFilters, setCollectedFilters] = useState<Record<string, string[]> | null>(null);
  
  // State for products
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch some real products from the 'deurklink' category (ID: 58 based on our DB check)
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/products?category=58&per_page=40')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           setAllProducts(data);
           // We intentionally start with an empty filtered list until the wizard is complete
           setFilteredProducts([]); 
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // DYNAMIC FILTERING LOGIC
  const evaluateFilters = (answers: Record<string, string[]>, productsToFilter: any[]) => {
    return productsToFilter.filter(product => {
       let isMatch = true;

       if (answers.usage && answers.usage.length > 0) {
          const productAttr = product.attributes?.find((a: any) => a.name === "pa_indoor_outdoor" || a.name.toLowerCase() === "indoor outdoor");
          if (!productAttr) isMatch = false; 
          else {
             const hasTerm = productAttr.options.some((opt: string) => 
               answers.usage.includes(opt.toLowerCase())
             );
             if (!hasTerm) isMatch = false;
          }
       }

       if (isMatch && answers.color && answers.color.length > 0) {
          const productAttr = product.attributes?.find((a: any) => a.name === "pa_color" || a.name.toLowerCase() === "color" || a.name.toLowerCase() === "kleur");
          if (!productAttr) isMatch = false; 
          else {
             const hasTerm = productAttr.options.some((opt: string) => 
               answers.color.some(color => opt.toLowerCase().includes(color.toLowerCase()))
             );
             if (!hasTerm) isMatch = false;
          }
       }

       if (isMatch && answers.type && answers.type.length > 0) {
          const productAttr = product.attributes?.find((a: any) => a.name === "pa_rosette_type" || a.name.toLowerCase() === "rozet type" || a.name.toLowerCase() === "type rozet/schild");
          if (productAttr) {
             const hasTerm = productAttr.options.some((opt: string) => 
                answers.type.some(t => opt.toLowerCase().includes(t.toLowerCase()))
             );
             if (!hasTerm) isMatch = false;
          }
       }

       return isMatch;
    });
  };

  const handleComplete = (answers: Record<string, string[]>) => {
    // Intentionally omitting setIsModalOpen(false) since KeuzehulpModal manages the Results view internally now!
    setCollectedFilters(answers);
    const result = evaluateFilters(answers, allProducts);
    setFilteredProducts(result);
  };

  const calculateMatchingCount = (partialAnswers: Record<string, string[]>) => {
    return evaluateFilters(partialAnswers, allProducts).length;
  };

  const handleReset = () => {
     setCollectedFilters(null);
     setFilteredProducts([]);
     setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Deurklinken Category</h1>
          <p className="text-gray-500 mb-8 text-lg">
            This demo fetches 40 real products from your WooCommerce store. Try filtering them with the wizard!
          </p>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FF7A00] hover:bg-[#E66A00] text-white px-8 py-4 rounded font-bold text-lg transition duration-200 shadow-md"
          >
            Start de keuzehulp »
          </button>
        </div>
      </div>
      <KeuzehulpModal 
        categorySlug="deurklink" 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onComplete={handleComplete}
        allProducts={allProducts}
      />
    </main>
  );
}
