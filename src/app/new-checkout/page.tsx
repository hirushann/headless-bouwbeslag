"use client";

import React, { useState } from "react";
import { ChevronRight, CreditCard, Package, ShieldCheck, Truck, Check } from "lucide-react";

export default function NewCheckoutPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedShipping, setSelectedShipping] = useState("standard");

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // Helper for input styles to match screenshot
  const inputParams = "input w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all rounded-lg h-12";
  const labelParams = "label text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <main className="max-w-[1440px] mx-auto px-2  py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT COLUMN: Steps & Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Billing Details */}
            <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${currentStep === 1 ? "border-blue-600 ring-1 ring-blue-600 shadow-md" : "border-gray-200"}`}>
              <div 
                className={`p-6 flex items-center justify-between cursor-pointer ${currentStep === 1 ? "border-b border-gray-100" : ""}`}
                onClick={() => goToStep(1)}
              >
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  {currentStep > 1 ? (
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold shadow-md shadow-green-200">
                      <Check className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-md ${currentStep === 1 ? "bg-blue-600 text-white shadow-blue-200" : "bg-gray-100 text-gray-500"}`}>1</span>
                  )}
                  <span className={currentStep > 1 ? "text-gray-900" : "text-gray-900"}>Billing Details</span>
                </h2>
                {currentStep > 1 && (
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">Edit</button>
                )}
              </div>
              
              {currentStep === 1 && (
                <div className="p-6 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="space-y-5 mb-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="form-control">
                        <label className={labelParams}>First name <span className="text-red-500">*</span></label>
                        <input type="text" className={inputParams} defaultValue="Roary" />
                      </div>
                      <div className="form-control">
                        <label className={labelParams}>Last name <span className="text-red-500">*</span></label>
                        <input type="text" className={inputParams} defaultValue="Morton" />
                      </div>
                    </div>

                     {/* Country */}
                     <div className="form-control">
                        <label className={labelParams}>Country/Region <span className="text-red-500">*</span></label>
                        <select className={`select w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all rounded-lg h-12 font-normal text-base`}>
                            <option disabled selected>Select a country/region...</option>
                            <option>Netherlands</option>
                            <option>Belgium</option>
                            <option>Germany</option>
                        </select>
                     </div>

                    {/* Street Address */}
                    <div className="form-control">
                        <label className={labelParams}>Street and house number <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="House number and street name" className={`${inputParams} mb-3`} defaultValue="14 South Hague Road" />
                        <input type="text" placeholder="Apartment, suite, unit, etc. (optional)" className={inputParams} defaultValue="Anim ea explicabo B" />
                    </div>

                    {/* Postcode & City */}
                    <div className="form-control">
                        <label className={labelParams}>Postcode <span className="text-red-500">*</span></label>
                        <input type="text" className={inputParams} defaultValue="ESTTEMPORIBUSAPER" />
                    </div>
                     <div className="form-control">
                        <label className={labelParams}>City <span className="text-red-500">*</span></label>
                        <input type="text" className={inputParams} defaultValue="Qui mollitia ipsa o" />
                    </div>

                    {/* Phone & Email */}
                    <div className="form-control">
                      <label className={labelParams}>Phone (optional)</label>
                      <input type="tel" className={inputParams} defaultValue="+1 (906) 678-5903" />
                    </div>
                    <div className="form-control">
                      <label className={labelParams}>Email address <span className="text-red-500">*</span></label>
                      <input type="email" className={inputParams} defaultValue="radaz@mailinator.com" />
                    </div>
                  </div>

                  <button 
                    onClick={nextStep}
                    className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none min-h-[48px] px-8 rounded-xl font-semibold shadow-lg shadow-blue-600/20 w-auto"
                  >
                    Next Step
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Shipping Method (Renumbered) */}
             <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${currentStep === 2 ? "border-blue-600 ring-1 ring-blue-600 shadow-md" : "border-gray-200"} ${currentStep < 2 ? "opacity-60 grayscale-[0.5]" : ""}`}>
              <div 
                className={`p-6 flex items-center justify-between ${currentStep > 2 ? "cursor-pointer" : ""} ${currentStep === 2 ? "border-b border-gray-100" : ""}`}
                onClick={() => goToStep(2)}
              >
                <h2 className="text-xl font-semibold flex items-center gap-3">
                   {currentStep > 2 ? (
                     <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold shadow-md shadow-green-200">
                      <Check className="w-5 h-5" />
                    </span>
                  ) : (
                   <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-md ${currentStep === 2 ? "bg-blue-600 text-white shadow-blue-200" : "bg-gray-100 text-gray-500"}`}>2</span>
                  )}
                  Shipping Method
                </h2>
                {currentStep > 2 && (
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">Edit</button>
                )}
              </div>
              
              {currentStep === 2 && (
                <div className="p-6 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="space-y-3 mb-6">
                        {/* <div onClick={() => setSelectedShipping("standard")} className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${selectedShipping === "standard" ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg border border-gray-100 text-blue-600"><Truck className="w-5 h-5"/></div>
                                <div>
                                    <div className="font-semibold text-gray-900">Standard Delivery</div>
                                    <div className="text-sm text-gray-500">Delivered within 3-5 business days</div>
                                </div>
                            </div>
                            <div className="font-semibold text-gray-900">Free</div>
                        </div> */}
                        <div onClick={() => setSelectedShipping("express")} className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${selectedShipping === "express" ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg border border-gray-100 text-purple-600"><Package className="w-5 h-5"/></div>
                                <div>
                                    <div className="font-semibold text-gray-900">Express Delivery</div>
                                    <div className="text-sm text-gray-500">Delivered tomorrow</div>
                                </div>
                            </div>
                            <div className="font-semibold text-gray-900">€9.95</div>
                        </div>
                    </div>
                     <div className="flex gap-3">
                     <button 
                        onClick={() => goToStep(1)}
                        className="btn btn-ghost text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        Back
                      </button>
                    <button 
                        onClick={nextStep}
                        className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none min-h-[48px] px-8 rounded-xl font-semibold shadow-lg shadow-blue-600/20"
                    >
                        Next Step
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment (Renumbered) */}
             <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${currentStep === 3 ? "border-blue-600 ring-1 ring-blue-600 shadow-md" : "border-gray-200"} ${currentStep < 3 ? "opacity-60 grayscale-[0.5]" : ""}`}>
              <div className="p-6 flex items-center justify-between border-b border-transparent">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                   <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-md ${currentStep === 3 ? "bg-blue-600 text-white shadow-blue-200" : "bg-gray-100 text-gray-500"}`}>3</span>
                  Payment
                </h2>
              </div>
              
               {currentStep === 3 && (
                 <div className="p-6 pt-0 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-400 mb-6">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Payment integration would happen here.</p>
                    </div>
                     <button 
                        onClick={() => alert("Order Placed!")}
                        className="w-full btn btn-primary bg-green-600 hover:bg-green-700 text-white border-none h-14 rounded-xl text-lg font-bold shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                        Confirm & Pay €69.58
                    </button>
                    <div className="flex justify-center mt-4">
                        <button 
                            onClick={() => goToStep(2)}
                            className="btn btn-ghost btn-sm text-gray-500 hover:text-gray-700"
                        >
                            Back to Shipping Method
                        </button>
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary (Sticky) */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 space-y-6">
              
              <h3 className="text-2xl font-bold text-gray-900">Jouw Bestelling</h3>

              {/* Items Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                  {/* Mock Item 1 */}
                  <div className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                      <div className="w-16 h-16 bg-white rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package className="w-8 h-8 text-gray-300" />
                      </div>
                      <div className="flex-1 flex justify-between">
                          <div>
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">JNF GLASPLAATDRAGER 100 200 MM TITANIUM COPPER</h4>
                              <p className="text-sm text-gray-500 mt-1">× 1</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900 whitespace-nowrap ml-2">€ 32,03</span>
                      </div>
                  </div>
                  
                  {/* Mock Item 2 */}
                  <div className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                       <div className="w-16 h-16 bg-white rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0">
                            {/* Placeholder image */}
                           <div className="w-full h-full bg-gray-200 rounded-md"></div> 
                      </div>
                      <div className="flex-1 flex justify-between">
                          <div>
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">M8 Draaideind stuk 30cm</h4>
                              <p className="text-sm text-gray-500 mt-1">× 61</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900 whitespace-nowrap ml-2">€ 18,30</span>
                      </div>
                  </div>
              </div>

              {/* Totals Card */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex justify-between text-base text-gray-600">
                        <span>Subtotaal</span>
                        <span className="font-medium text-gray-900">€ 50,33</span>
                    </div>
                    <div className="flex justify-between text-base text-gray-600">
                        <span>Verzending</span>
                        <span className="font-medium text-gray-900">Shipping rate: € 15,00</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center text-lg font-bold text-gray-900">
                        <span>Totaal</span>
                        <span>€ 65,33</span>
                    </div>
               </div>

              {/* Guarantees - kept as likely useful but styled minimally */}
               <div className="flex flex-col gap-2 opacity-70">
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-green-600"/>
                    <span>Veilig betalen met SSL-beveiliging</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Truck className="w-4 h-4 text-blue-600"/>
                    <span>Gratis verzending boven €100</span>
                 </div>
               </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
