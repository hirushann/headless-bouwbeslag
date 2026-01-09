"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, CreditCard, Package, ShieldCheck, Truck, Check, Loader2 } from "lucide-react";
import { getShippingRatesAction, placeOrderAction } from "./actions";
import { useCartStore } from "@/lib/cartStore";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/UserContext";

export default function NewCheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  // const [selectedShipping, setSelectedShipping] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]); // Should use ShippingMethod interface
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);

  const { userRole } = useUserContext();
  const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));
  
  // Cart State from Store
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  
  // Hydration check for persisted store
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    country: "",
    street: "",
    apartment: "",
    postcode: "",
    city: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    // Fetch shipping rates on mount
    const fetchRates = async () => {
      const result = await getShippingRatesAction();
      if (result.success && result.methods) {
        setAvailableMethods(result.methods);
        // Pre-select the first method if available
        if (result.methods.length > 0) {
            setSelectedMethodId(result.methods[0].id);
        }
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    // Scroll to the top of the active step when it changes
    const element = document.getElementById(`step-${currentStep}`);
    if (element) {
        const headerOffset = 120; 
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
  }, [currentStep]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Update shipping cost whenever rates or selected method changes
  // Derive valid methods
  const validMethods = React.useMemo(() => {
    return availableMethods.filter(method => {
       if (method.methodId === 'free_shipping') {
         // Check requires
         if (method.requires === 'min_amount' || method.requires === 'either') {
             const minAmount = method.minAmount ? parseFloat(method.minAmount) : 0;
             if (subtotal < minAmount) return false;
         }
       }
       return true;
    });
  }, [availableMethods, subtotal]);

  // Update shipping cost whenever rates or selected method changes
  // AND Auto-select if needed
  useEffect(() => {
    // 1. If we have valid methods but none selected (or selected is invalid), select first one
    if (validMethods.length > 0) {
        const currentValid = validMethods.find(m => m.id === selectedMethodId);
        if (!selectedMethodId || !currentValid) {
            setSelectedMethodId(validMethods[0].id);
            return; // Effect will re-run with new ID
        }
    } else {
        // No valid methods? Deselect
        if (selectedMethodId) setSelectedMethodId(null);
    }
    
    // 2. Calculate Cost
    if (selectedMethodId === null) {
        setShippingCost(null);
        return;
    }
    
    const method = validMethods.find(m => m.id === selectedMethodId);
    if (!method) {
        setShippingCost(null);
        return;
    }
    
    let cost = method.cost;
    // Special handling if free shipping is technically "costly" in DB but free in practice? 
    // Usually woo returns 0. But just in case:
    if (method.methodId === 'free_shipping') {
        cost = 0; 
    }
    
    setShippingCost(cost);

  }, [validMethods, selectedMethodId]);

  const tax = subtotal * 0.21; // 21% Tax on items
  
  // Header logic: Total = (subtotal + shipping) * 1.21 for B2C (Inc VAT).
  // Subtotal here (from cartStore) is Ex-VAT.
  // Shipping cost (flatRate) is Ex-VAT.
  
  // If B2B: Show Ex-VAT prices. Total = Subtotal + Shipping.
  // If B2C: Show Inc-VAT prices. Total = (Subtotal + Shipping) * 1.21.
  
  const total = isB2B 
    ? subtotal + (shippingCost || 0) 
    : (subtotal + (shippingCost || 0)) * 1.21;
    
  // Display Helpers
  const displaySubtotal = isB2B ? subtotal : subtotal * 1.21;
  const displayShipping = isB2B ? (shippingCost || 0) : (shippingCost || 0) * 1.21;
  const displayTax = isB2B ? 0 : tax; // Tax line is redundant in Inc-VAT view usually, or we show full tax breakdown?
  // Header shows: Totaal + (incl. BTW) label.
  
  const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    
    // Construct billing object for WooCommerce
    const billingData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        address_1: formData.street,
        address_2: formData.apartment,
        city: formData.city,
        state: "", // Add state if needed
        postcode: formData.postcode,
        country: formData.country === "Netherlands" ? "NL" : (formData.country === "Belgium" ? "BE" : "DE"), // Simple mapping
        email: formData.email,
        phone: formData.phone
    };

    const method = availableMethods.find(m => m.id === selectedMethodId);

    const orderData = {
        billing: billingData,
        shipping: billingData, // Assuming shipping same as billing for this simplified flow
        cart: cartItems,
        payment_method: "mollie",
        shipping_line: method ? [{
             method_id: method.methodId,
             method_title: method.title,
             total: method.cost.toString()
        }] : []
    };

    const result = await placeOrderAction(orderData);
    setIsLoading(false);

    if (result.success) {
        if ((result as any).redirectUrl) {
            window.location.href = (result as any).redirectUrl;
            return;
        }

        // Fallback for non-payment orders (if any)
      const orderId = (result as any).data?.id || (result as any).orderId;
      router.push(`/checkout/success?orderId=${orderId}`); // Clear cart on success
    } else {
        alert(`Order Failed: ${result.message}`);
    }
  };


  // Helper for input styles
  const inputParams = "input w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all rounded-lg h-12";
  const labelParams = "label text-sm font-semibold text-gray-700 mb-1";
  
  // Helper to handle input changes
  const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isHydrated) {
      return null; // Or a loading spinner
  }

  // Empty Cart State
  if (cartItems.length === 0) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Je winkelwagen is leeg</h2>
              <p className="text-gray-500 mb-6">Voeg enkele producten toe om door te gaan naar de checkout.</p>
              <a href="/" className="btn btn-primary bg-blue-600 border-none text-white rounded-xl">Verder winkelen</a>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <main className="max-w-[1440px] mx-auto px-2 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT COLUMN: Steps & Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Billing Details */}
            <div id="step-1" className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${currentStep === 1 ? "border-blue-600 ring-1 ring-blue-600 shadow-md" : "border-gray-200"}`}>
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
                  <span className={currentStep > 1 ? "text-gray-900" : "text-gray-900"}>Factuurgegevens</span>
                </h2>
                {currentStep > 1 && (
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">Bewerken</button>
                )}
              </div>
              
              {currentStep === 1 && (
                <div className="p-6 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="space-y-5 mb-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="form-control">
                        <label className={labelParams}>Voornaam <span className="text-red-500">*</span></label>
                        <input type="text" className={inputParams} value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} />
                      </div>
                      <div className="form-control">
                        <label className={labelParams}>Achternaam <span className="text-red-500">*</span></label>
                        <input type="text" className={inputParams} value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} />
                      </div>
                    </div>

                     {/* Country */}
                     <div className="form-control">
                        <label className={labelParams}>Land <span className="text-red-500">*</span></label>
                        <select className={`select w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all rounded-lg h-12 font-normal text-base`} value={formData.country} onChange={(e) => handleInputChange("country", e.target.value)}>
                            <option disabled>Selecteer een land...</option>
                            <option>Netherlands</option>
                            <option>Belgium</option>
                            <option>Germany</option>
                        </select>
                     </div>

                    {/* Street Address */}
                    <div className="form-control">
                        <label className={labelParams}>Straat en huisnummer <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="Huisnummer en straatnaam" className={`${inputParams} mb-3`} value={formData.street} onChange={(e) => handleInputChange("street", e.target.value)} />
                        <input type="text" placeholder="Appartement, suite, unit, enz. (optioneel)" className={inputParams} value={formData.apartment} onChange={(e) => handleInputChange("apartment", e.target.value)} />
                    </div>

                    {/* Postcode & City */}
                    <div className="form-control">
                        <label className={labelParams}>Postcode <span className="text-red-500">*</span></label>
                        <input type="text" className={inputParams} value={formData.postcode} onChange={(e) => handleInputChange("postcode", e.target.value)} />
                    </div>
                     <div className="form-control">
                        <label className={labelParams}>Plaats <span className="text-red-500">*</span></label>
                        <input type="text" className={inputParams} value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
                    </div>

                    {/* Phone & Email */}
                    <div className="form-control">
                      <label className={labelParams}>Telefoon (optioneel)</label>
                      <input type="tel" className={inputParams} value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                    </div>
                    <div className="form-control">
                      <label className={labelParams}>Email adres <span className="text-red-500">*</span></label>
                      <input type="email" className={inputParams} value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                    </div>
                  </div>

                  <button 
                    onClick={nextStep}
                    className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none min-h-[48px] px-8 rounded-xl font-semibold shadow-lg shadow-blue-600/20 w-auto"
                  >
                    Volgende stap
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Shipping Method (Renumbered) */}
             <div id="step-2" className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${currentStep === 2 ? "border-blue-600 ring-1 ring-blue-600 shadow-md" : "border-gray-200"} ${currentStep < 2 ? "opacity-60 grayscale-[0.5]" : ""}`}>
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
                  Verzendmethode
                </h2>
                {currentStep > 2 && (
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">Bewerken</button>
                )}
              </div>
              
              {currentStep === 2 && (
                <div className="p-6 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="space-y-3 mb-6">
                        {validMethods.length === 0 ? (
                             <p className="text-gray-500 text-center py-4">Verzendmethoden laden...</p>
                        ) : (
                            validMethods.map((method) => {
                                return (
                                <div 
                                    key={method.id}
                                    onClick={() => setSelectedMethodId(method.id)} 
                                    className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${selectedMethodId === method.id ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 bg-white rounded-lg border border-gray-100 ${method.methodId === 'free_shipping' ? 'text-green-600' : 'text-blue-600'}`}>
                                            {method.methodId === 'free_shipping' ? <Package className="w-5 h-5"/> : <Truck className="w-5 h-5"/>}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{method.title}</div>
                                            <div className="text-sm text-gray-500">{method.methodId === 'flat_rate' ? 'Standard delivery' : 'Delivery option'}</div>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                        {method.cost === 0 ? "Free" : `€${(isB2B ? method.cost : method.cost * 1.21).toFixed(2)}`}
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>
                     <div className="flex gap-3">
                     <button 
                        onClick={() => goToStep(1)}
                        className="btn btn-ghost text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        Terug
                      </button>
                    <button 
                        onClick={nextStep}
                        className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none min-h-[48px] px-8 rounded-xl font-semibold shadow-lg shadow-blue-600/20"
                    >
                        Volgende stap
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment (Renumbered) */}
             <div id="step-3" className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${currentStep === 3 ? "border-blue-600 ring-1 ring-blue-600 shadow-md" : "border-gray-200"} ${currentStep < 3 ? "opacity-60 grayscale-[0.5]" : ""}`}>
              <div className="p-6 flex items-center justify-between border-b border-transparent">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                   <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-md ${currentStep === 3 ? "bg-blue-600 text-white shadow-blue-200" : "bg-gray-100 text-gray-500"}`}>3</span>
                  Betaling
                </h2>
              </div>
              
               {currentStep === 3 && (
                 <div className="p-6 pt-0 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-500 mb-6">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-semibold">Betaling</p>
                        <p className="text-sm">Betalen met iDEAL, Credit Card, Bancontact, en meer via Mollie.</p>
                    </div>
                     <button 
                        onClick={handlePlaceOrder}
                        disabled={isLoading}
                        className="w-full btn btn-primary bg-green-600 hover:bg-green-700 text-white border-none h-14 rounded-xl text-lg font-bold shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                         {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : `Bevestig & Betalen €${total.toFixed(2)}`}
                    </button>
                    <div className="flex justify-center mt-4">
                        <button 
                            onClick={() => goToStep(2)}
                            className="btn btn-ghost btn-sm text-gray-500 hover:text-gray-700"
                        >
                            Terug naar Verzendmethode
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
                  {/* Real Cart Items */}
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                        <div className="w-16 h-16 bg-white rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0">
                             {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" /> : <Package className="w-8 h-8 text-gray-300" />}
                        </div>
                        <div className="flex-1 flex justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">× {item.quantity}</p>
                            </div>
                            <span className="text-sm font-medium text-gray-900 whitespace-nowrap ml-2">€ {(isB2B ? item.price : item.price * 1.21).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                  ))}
              </div>

              {/* Totals Card */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex justify-between text-base text-gray-600">
                        <span>Subtotaal</span>
                        <span className="font-medium text-gray-900">€ {displaySubtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-base text-gray-600">
                        <span>Verzending</span>
                        <span className="font-medium text-gray-900">
                            {shippingCost === null ? "Calculated at next step" : (shippingCost === 0 ? "Free" : `€ ${displayShipping.toFixed(2).replace('.', ',')}`)}
                        </span>
                    </div>
                     {/* Show Tax breakdown if needed, or total tax amount? Header handles it by showing total + label */}
                    <div className="flex justify-between text-base text-gray-600">
                        <span>BTW (21%)</span>
                         {/* Calculate actual tax amount for the whole order */}
                        <span className="font-medium text-gray-900">€ {((subtotal + (shippingCost || 0)) * 0.21).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center text-lg font-bold text-gray-900">
                        <span>Totaal <span className="text-xs font-normal text-gray-500">{taxLabel}</span></span>
                        <span>€ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
               </div>

              {/* Guarantees */}
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
