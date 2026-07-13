"use client";

import React, { useState, useEffect } from "react";
import KeuzehulpModal from "@/components/KeuzehulpModal";
import { fetchKeuzehulpProductsAction } from "./actions";

export default function KeuzehulpDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collectedFilters, setCollectedFilters] = useState<Record<string, string[]> | null>(null);
  
  // State for products
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products from Meilisearch via server action
  useEffect(() => {
    setIsLoading(true);
    fetchKeuzehulpProductsAction("deurklink")
      .then(result => {
        if (result.success && Array.isArray(result.products)) {
          setAllProducts(result.products);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleComplete = (answers: Record<string, string[]>) => {
    setCollectedFilters(answers);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Deurklinken Keuzehulp</h1>
          <p className="text-gray-500 mb-2 text-lg">
            Vind de perfecte deurklink met onze keuzehulp wizard.
          </p>
          {isLoading ? (
            <p className="text-sm text-gray-400 mb-8">Producten laden...</p>
          ) : (
            <p className="text-sm text-gray-400 mb-8">{allProducts.length} producten geladen uit Meilisearch</p>
          )}
          
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading || allProducts.length === 0}
            className="bg-[#FF7A00] hover:bg-[#E66A00] text-white px-8 py-4 rounded font-bold text-lg transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start de keuzehulp »
          </button>

          {collectedFilters && (
            <div className="mt-8 text-left bg-gray-50 p-6 rounded-xl">
              <h3 className="font-bold text-gray-700 mb-2">Geselecteerde filters:</h3>
              <pre className="text-sm text-gray-600">{JSON.stringify(collectedFilters, null, 2)}</pre>
              <button onClick={() => { setCollectedFilters(null); setIsModalOpen(true); }} className="mt-4 text-blue-500 hover:text-blue-700 text-sm font-medium">
                Opnieuw beginnen
              </button>
            </div>
          )}
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
