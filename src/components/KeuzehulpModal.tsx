"use client";

import React, { useState } from "react";
import { KeuzehulpStep, KeuzehulpConfig } from "@/config/keuzehulp.config";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";

interface KeuzehulpModalProps {
  categorySlug: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (collectedAnswers: Record<string, string[]>) => void;
  allProducts: any[];
}

export default function KeuzehulpModal({ categorySlug, isOpen, onClose, onComplete, allProducts }: KeuzehulpModalProps) {
  const steps: KeuzehulpStep[] = KeuzehulpConfig[categorySlug] || [];
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState(false);

  if (!isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isMulti = currentStep.type === "multi";
  const selectedForCurrent = answers[currentStep.id] || [];

  // Replicated Evaluation logic for Modal preview
  const evaluateFilters = (currentAnswers: Record<string, string[]>) => {
    return allProducts.filter(product => {
       let isMatch = true;

       if (currentAnswers.usage && currentAnswers.usage.length > 0) {
          const productAttr = product.attributes?.find((a: any) => a.name === "pa_indoor_outdoor" || a.name.toLowerCase() === "indoor outdoor");
          if (!productAttr) isMatch = false; 
          else {
             const hasTerm = productAttr.options.some((opt: string) => 
               currentAnswers.usage.includes(opt.toLowerCase())
             );
             if (!hasTerm) isMatch = false;
          }
       }

       if (isMatch && currentAnswers.color && currentAnswers.color.length > 0) {
          const productAttr = product.attributes?.find((a: any) => a.name === "pa_color" || a.name.toLowerCase() === "color" || a.name.toLowerCase() === "kleur");
          if (!productAttr) isMatch = false; 
          else {
             // Let's do a soft inclusions check
             const hasTerm = productAttr.options.some((opt: string) => 
               currentAnswers.color.some(color => opt.toLowerCase().includes(color.toLowerCase()))
             );
             if (!hasTerm) isMatch = false;
          }
       }

       // For demo dummy purposes, if a product lacks the 'type' attribute, we won't strictly fail it unless we have strict taxonomy matching setup.
       if (isMatch && currentAnswers.type && currentAnswers.type.length > 0) {
          const productAttr = product.attributes?.find((a: any) => a.name === "pa_rosette_type" || a.name.toLowerCase() === "rozet type" || a.name.toLowerCase() === "type rozet/schild");
          if (productAttr) {
             const hasTerm = productAttr.options.some((opt: string) => 
                currentAnswers.type.some(t => opt.toLowerCase().includes(t.toLowerCase()))
             );
             if (!hasTerm) isMatch = false;
          }
       }

       return isMatch;
    });
  };

  const currentMatchingProductsCount = evaluateFilters(answers).length;

  const handleChoiceClick = (choiceId: string) => {
    if (isMulti) {
      setAnswers(prev => {
        const currentSelected = prev[currentStep.id] || [];
        if (currentSelected.includes(choiceId)) {
          return { ...prev, [currentStep.id]: currentSelected.filter(id => id !== choiceId) };
        } else {
          return { ...prev, [currentStep.id]: [...currentSelected, choiceId] };
        }
      });
    } else {
      // Single choice: set it and auto-advance
      setAnswers(prev => ({ ...prev, [currentStep.id]: [choiceId] }));
      
      setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          // Finished
          const finalAnswers = { ...answers, [currentStep.id]: [choiceId] };
          setAnswers(finalAnswers);
          setShowResults(true);
          onComplete(finalAnswers);
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setShowResults(true);
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStepIndex(0);
    setShowResults(false);
  };

  const currentMatchingProducts = evaluateFilters(answers);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex gap-4">
            {showResults ? (
               <button onClick={() => setShowResults(false)} className="text-gray-500 hover:text-gray-900 transition font-medium flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                 Vorige
              </button>
            ) : (
               <button onClick={handlePrev} disabled={currentStepIndex === 0} className="text-gray-500 hover:text-gray-900 disabled:opacity-30 transition font-medium flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                 Vorige
              </button>
            )}
            
            <button onClick={handleReset} className="text-blue-500 hover:text-blue-700 transition text-sm font-medium flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
               Naar begin
            </button>
          </div>
          
          {!showResults && (
            <button onClick={() => { setShowResults(true); onComplete(answers); }} className="text-sm font-bold text-gray-500 hover:text-[#FF7A00] transition">
               Sla over naar resultaten ({currentMatchingProductsCount})
            </button>
          )}

          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5">
          <div className="bg-blue-600 h-1.5 transition-all duration-300" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} />
        </div>

        {/* Content */}
        {showResults ? (
          <div className="p-8 flex-1 overflow-y-auto bg-gray-50">
             <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">Dit zijn de beste keuzes voor jou ({currentMatchingProducts.length})</h2>
                {currentMatchingProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {currentMatchingProducts.map((product: any, index: number) => (
                      <div key={product.id} className="relative">
                        {index === 0 && (
                           <div className="absolute -top-3 right-0 left-0 flex justify-center z-10">
                              <span className="bg-[#FF7A00] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded shadow-md">
                                 Beste keus voor jouw wensen
                              </span>
                           </div>
                        )}
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                     <p className="text-xl text-gray-500 font-medium">Oeps! Er zijn geen producten die aan al je eisen voldoen.</p>
                     <button onClick={() => setShowResults(false)} className="mt-4 text-blue-500 hover:text-blue-700 text-lg">Verander je keuzes</button>
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="p-8 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-center mb-8 text-[#1A202C]">{currentStep.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  {currentStep.choices.map((choice) => {
                    const isSelected = selectedForCurrent.includes(choice.id);
                    
                    let choiceAnswers = { ...answers };
                    if (isMulti) {
                      if (!isSelected) {
                          choiceAnswers[currentStep.id] = [...selectedForCurrent, choice.id];
                      }
                    } else {
                      choiceAnswers[currentStep.id] = [choice.id];
                    }
                    
                    const isAvailable = evaluateFilters(choiceAnswers).length > 0;
                    const isDisabled = !isAvailable && !isSelected;

                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleChoiceClick(choice.id)}
                        disabled={isDisabled}
                        className={`relative flex flex-col items-center bg-white border-2 rounded-xl overflow-hidden transition-all duration-200 ${
                          isSelected ? "border-blue-500 shadow-md ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        } ${isDisabled ? "opacity-40 grayscale cursor-not-allowed hidden md:flex" : ""}`}
                      >
                        <img src={choice.image} alt={choice.label} className="w-full aspect-square object-cover bg-gray-50" />
                        <div className={`w-full p-4 text-center font-medium ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                          {choice.label}
                          {isDisabled && <span className="block text-xs text-red-500 mt-1">Niet beschikbaar</span>}
                        </div>
                        
                        {isMulti && isSelected && (
                          <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1 shadow-sm">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Footer (for Multiple Choice) */}
        {!showResults && isMulti && (
           <div className="p-6 border-t border-gray-100 flex justify-center bg-gray-50">
              <button 
                onClick={handleNext} 
                className="bg-[#FF7A00] text-white px-10 py-3 rounded text-lg font-bold hover:bg-[#E66A00] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volgende
              </button>
           </div>
        )}
      </motion.div>
    </div>
  );
}
