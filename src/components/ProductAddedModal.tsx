"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cartStore";
import RecommendedProductItem from "@/components/RecommendedProductItem";
import { useProductAddedModal } from "@/context/ProductAddedModalContext";

export default function ProductAddedModal() {
  const { isOpen, closeModal, modalData } = useProductAddedModal();

  // We rely on AnimatePresence so we render null if not open INSIDE the AnimatePresence check usually,
  // but here we want to wrap the whole thing.
  // Actually, for AnimatePresence to work, the component calling it usually handles the conditional, 
  // OR this component returns the AnimatePresence structure.
  
  // If we return null when isOpen is false, AnimatePresence inside won't work if it's top level.
  // Unless we put AnimatePresence inside and conditional `isOpen` inside.
  
  return (
    <AnimatePresence>
      {isOpen && modalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
          >
            {/* Header */}
            <div className="p-5 lg:p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="bg-[#EDFCF2] p-2 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="#03B955" className="size-5 lg:size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-lg lg:text-2xl font-bold text-[#1C2530]">Product toegevoegd aan winkelwagen</h2>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-5 lg:size-6 text-gray-400 group-hover:text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 lg:p-8 custom-scrollbar">
              {/* Just Added Product */}
              <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-center p-4 lg:p-3 bg-white lg:bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] mb-8 lg:mb-10">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white rounded-lg border border-[#E2E8F0] overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-sm">
                  <img 
                    src={modalData.product?.images?.[0]?.src || "/afbeelding.webp"} 
                    alt={modalData.product?.name || "Product"} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-base lg:text-base text-[#1C2530] leading-tight">{modalData.product?.name}</h3>
                  <div className="flex flex-col md:flex-row items-center gap-2 justify-center md:justify-start mt-2">
                     <span className="bg-blue-100 text-[#0066FF] px-2 py-0.5 rounded text-[10px] lg:text-xs font-bold uppercase tracking-wider">Aantal: {modalData.quantity}</span>
                     <div className="text-[10px] lg:text-xs">
                        {modalData.deliveryText && (
                            <span className={`font-bold ${modalData.deliveryType === 'IN_STOCK' || modalData.deliveryType === 'PARTIAL_STOCK' ? 'text-[#03B955]' : 'text-[#FF5E00]'}`}>
                              {modalData.deliveryText}
                            </span>
                        )}
                     </div>
                  </div>
                </div>
                <div className="text-center md:text-right flex flex-col items-center md:items-end">
                  <p className="text-xl lg:text-2xl font-bold text-[#0066FF] tracking-tight">
                    {modalData.currency || "€"}{modalData.totalPrice?.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[10px] lg:text-xs text-[#64748B] font-medium mt-1">
                    {modalData.userRole && (modalData.userRole.includes("b2b_customer") || modalData.userRole.includes("administrator")) ? "Excl. BTW" : "Incl. BTW"}
                  </p>
                </div>
              </div>

              {/* Recommendations Section */}
              {modalData.musthaveprodKeys && modalData.musthaveprodKeys.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg lg:text-xl font-bold text-[#1C2530]">Vaak samen gekocht</h3>
                      <p className="text-sm text-gray-500 font-medium tracking-tight">Handige accessoires voor een nog beter resultaat</p>
                    </div>
                    <div className="hidden lg:flex items-center gap-1 text-[#0066FF] font-bold text-sm bg-blue-50 px-3 py-1 rounded-full">
                       <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse"></span>
                       Bespaar verzendkosten
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                    {modalData.musthaveprodKeys.slice(0, 4).map((item, index) => (
                      <RecommendedProductItem key={item.id || index} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-5 lg:p-8 bg-white border-t border-gray-100 flex flex-col-reverse md:flex-row gap-4 items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
              <button 
                onClick={closeModal}
                className="w-full md:w-auto px-10 py-4 text-[#475569] font-bold hover:text-[#1C2530] transition-all bg-gray-50 hover:bg-gray-100 rounded-lg text-base"
              >
                Verder winkelen
              </button>
              <button 
                onClick={() => {
                  closeModal();
                  useCartStore.getState().setCartOpen(true);
                }}
                className="w-full md:w-auto px-5 py-2 bg-[#0066FF] text-white font-semibold rounded-lg hover:bg-blue-700 transition-all text-center text-base shadow-lg shadow-blue-200 tracking-wide cursor-pointer"
              >
                Nu bestellen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
