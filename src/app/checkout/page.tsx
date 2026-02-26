"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, CreditCard, Package, ShieldCheck, Truck, Check, Loader2, Tag, X } from "lucide-react";
import { getShippingRatesAction, placeOrderAction, validateCouponAction, checkPostcodeAction, getPaymentMethodsAction, validateVatAction } from "./actions";
import { useCartStore } from "@/lib/cartStore";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/UserContext";
import toast from "react-hot-toast";
import Link from "next/link";
import { getDeliveryInfo } from "@/lib/deliveryUtils";

export default function NewCheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  // const [selectedShipping, setSelectedShipping] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]); // Should use ShippingMethod interface
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const { userRole, user } = useUserContext();
  const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));
  
  // Cart State from Store
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const lengthFreightCost = useCartStore((state) => state.lengthFreightCost());
  
  // Hydration check for persisted store
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    country: "Netherlands",
    street: "",
    houseNumber: "", // New field
    apartment: "",
    postcode: "",
    city: "",
    phone: "",
    email: "",
    vatNumber: "" // New VAT field
  });

  // Auto-fill form data if user is logged in
  useEffect(() => {
    if (user && user.billing) {
        // console.log("👤 Auto-filling checkout with user data:", user);
        
        // Split address_1 into street and house number if possible?
        // User data usually has address_1. We need to split it if our form separates them.
        // Or if user meta has separate fields.
        // Assuming address_1 is street + number.
        // A simple regex might try to split, or we just put it in street for now and let user fix.
        // Alternatively, if we saved it properly before...
        // Let's assume standard Woo billing:
        
        const b = user.billing;
        const address1 = b.address_1 || "";
        // Try to split street and number. 
        // Heuristic: Last token is number?
        // Many NL addresses: "Main Street 12"
        const match = address1.match(/^(.+)\s+(\d+[a-zA-Z]*)$/);
        let street = address1;
        let houseNumber = "";
        
        if (match) {
            street = match[1];
            houseNumber = match[2];
        }

        setFormData(prev => ({
            ...prev,
            firstName: b.first_name || prev.firstName,
            lastName: b.last_name || prev.lastName,
            companyName: b.company || prev.companyName,
            country: b.country === 'NL' ? 'Netherlands' : (b.country === 'BE' ? 'Belgium' : (b.country === 'DE' ? 'Germany' : prev.country)),
            street: street || prev.street,
            houseNumber: houseNumber || prev.houseNumber,
            apartment: b.address_2 || prev.apartment,
            postcode: b.postcode || prev.postcode,
            city: b.city || prev.city,
            phone: b.phone || prev.phone,
            email: b.email || user.email || prev.email,
        }));
        
        if (user.shipping) {
             const s = user.shipping;
             const sAddress1 = s.address_1 || "";
             const sMatch = sAddress1.match(/^(.+)\s+(\d+[a-zA-Z]*)$/);
             let sStreet = sAddress1;
             let sHouseNumber = "";

             if (sMatch) {
                sStreet = sMatch[1];
                sHouseNumber = sMatch[2];
             }

             setShippingData(prev => ({
                 ...prev,
                 firstName: s.first_name || prev.firstName,
                 lastName: s.last_name || prev.lastName,
                 companyName: s.company || prev.companyName,
                 country: s.country === 'NL' ? 'Netherlands' : (s.country === 'BE' ? 'Belgium' : (s.country === 'DE' ? 'Germany' : prev.country)),
                 street: sStreet || prev.street,
                 houseNumber: sHouseNumber || prev.houseNumber,
                 apartment: s.address_2 || prev.apartment,
                 postcode: s.postcode || prev.postcode,
                 city: s.city || prev.city,
             }));
        }
    }
  }, [user]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [vatValidationState, setVatValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  
  const [isCheckingPostcode, setIsCheckingPostcode] = useState(false);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [maatwerkAccepted, setMaatwerkAccepted] = useState(false);
  const [lengthFreightAccepted, setLengthFreightAccepted] = useState(false);

  // New Shipping & Notes State
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [shippingData, setShippingData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    country: "Netherlands",
    street: "",
    houseNumber: "",
    apartment: "",
    postcode: "",
    city: ""
  });
  const [orderNotes, setOrderNotes] = useState("");

  // Address lookup effect
  useEffect(() => {
    const checkAddress = async () => {
        const { postcode, houseNumber, country } = formData;
        
        if (country === 'Netherlands' && postcode.length >= 6 && houseNumber) {
            setIsCheckingPostcode(true);
            setPostcodeError(null);
            
            // Clean postcode
            const cleanPostcode = postcode.replace(/\s/g, '');
            
            const result = await checkPostcodeAction(cleanPostcode, houseNumber);
            
            if (result.success && result.data) {
                setFormData(prev => ({
                    ...prev,
                    street: result.data.street || prev.street, // Fallback if API doesn't return street (unlikely)
                    city: result.data.city || prev.city
                }));
                // Clear errors for street and city if populated
                setFormErrors(prev => {
                    const newErrors = { ...prev };
                    if (result.data.street) delete newErrors.street;
                    if (result.data.city) delete newErrors.city;
                    return newErrors;
                });
            } else {
                setPostcodeError(result.message || "Adres niet gevonden");
                // Optional: clear street/city or let user edit?
                // For now, let's clear them to avoid confusion, or keep them if user typed something?
                // Let's clear to force correct data, but enable editing if needed.
                setFormData(prev => ({ ...prev, street: "", city: "" })); 
            }
            setIsCheckingPostcode(false);
        }
    };
    
    // Debounce or just check when both are present?
    // Let's use a timeout debounce to avoid too many calls while typing
    const timeoutId = setTimeout(() => {
        checkAddress();
    }, 500);
    
    return () => clearTimeout(timeoutId);

  }, [formData.postcode, formData.houseNumber, formData.country]);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);

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

    const fetchPaymentMethods = async () => {
        const result = await getPaymentMethodsAction();
        if (result.success && result.methods) {
            setPaymentMethods(result.methods);
        }
    };
    fetchPaymentMethods();
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
  const hasLengthFreight = cartItems.some(i => i.hasLengthFreight);

  const validMethods = React.useMemo(() => {
    if (hasLengthFreight) {
        // Prioritize backend method if available
        const realMethod = availableMethods.find(m => m.title.toLowerCase().includes('lengtevracht'));
        if (realMethod) return [realMethod];

        return [{
            id: 9999, // distinct ID
            methodId: 'length_freight',
            title: 'Lengtevracht toeslag',
            // cost: lengthFreightCost / 1.21,
            cost: lengthFreightCost,
            enabled: true
        }];
    }

    return availableMethods.filter(method => {
       // Filter out Lengtevracht if not applicable (since hasLengthFreight is false here)
       if (method.title && method.title.toLowerCase().includes('lengtevracht')) {
           return false;
       }

       if (method.methodId === 'free_shipping') {
         // Check requires
         if (method.requires === 'min_amount' || method.requires === 'either') {
             const minAmount = method.minAmount ? parseFloat(method.minAmount) : 0;
             if (subtotal < minAmount) return false;
         }
       }
       return true;
    });
  }, [availableMethods, subtotal, hasLengthFreight]);

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

  /* 
    Enhanced Coupon Validation:
    We need to pass:
    - Current Cart Total (for min/max spend)
    - Cart Items (for product restrictions)
    - Customer Email (for email restrictions)

    Note on Total: 
    WP "Min/Max Spend" usually refers to the Subtotal Ex Tax? Or Inc Tax?
    WooCommerce standard: "The minimum spend is based on the subtotal **before** tax." (unless setting changed).
    Our `subtotal` variable is Ex-VAT sum of items.
  */

  const handleApplyCoupon = async () => {
      if (!couponCode.trim()) return;
      
      setIsCouponLoading(true);
      setCouponMessage(null);
      
      // Prepare data for validation
      // cartItems has { id, ... }. We need to ensure we pass IDs as numbers.
      const simplifiedItems = cartItems.map(item => ({ product_id: item.id }));
      
      const result = await validateCouponAction(
          couponCode, 
          subtotal, // Ex VAT subtotal
          simplifiedItems,
          formData.email // current email input
      );
      
      if (result.success && result.coupon) {
          setAppliedCoupon(result.coupon);
          setCouponMessage({ type: 'success', text: `Coupon "${result.coupon.code}" applied!` });
          setCouponCode(""); 
      } else {
          setCouponMessage({ type: 'error', text: result.message || "Invalid coupon" });
          setAppliedCoupon(null);
      }
      setIsCouponLoading(false);
  };

  const removeCoupon = () => {
      setAppliedCoupon(null);
      setCouponMessage(null);
  };

  const calculateDiscount = () => {
      if (!appliedCoupon) return 0;
      
      const subtotalVal = subtotal; // Ex VAT basic subtotal
      let discount = 0;

      if (appliedCoupon.discount_type === 'percent') {
          const amount = parseFloat(appliedCoupon.amount);
          discount = (subtotalVal * amount) / 100;
      } else if (appliedCoupon.discount_type === 'fixed_cart') {
          const amount = parseFloat(appliedCoupon.amount);
          // Amount is Gross (Inc VAT). We need the Ex VAT amount to deduct from Ex VAT subtotal.
          discount = amount / 1.21;
      }
      
      return discount;
  };

  const discountAmount = calculateDiscount();

  const tax = (subtotal - discountAmount) * 0.21; // Tax on discounted items
  
  // Calculate card payment fee (2.5% of order total excluding VAT)
  // Fee applies only when card payment method (creditcard) is selected
  const cardPaymentFee = React.useMemo(() => {
    if (selectedPaymentMethod === 'creditcard') {
      // Calculate fee on subtotal + shipping - discount (Ex VAT)
      const orderTotal = (subtotal - discountAmount) + (shippingCost || 0);
      return orderTotal * 0.025; // 2.5% fee
    }
    return 0;
  }, [selectedPaymentMethod, subtotal, discountAmount, shippingCost]);
  
  // Header logic: Total = (subtotal + shipping) * 1.21 for B2C (Inc VAT).
  // Subtotal here (from cartStore) is Ex-VAT.
  // Shipping cost (flatRate) is Ex-VAT.
  
  // If B2B: Show Ex-VAT prices. Total = Subtotal + Shipping + Card Fee.
  // If B2C: Show Inc-VAT prices. Total = (Subtotal + Shipping + Card Fee) * 1.21.
  
  // Header shows: Totaal + (incl. BTW) label.
  
  const total = isB2B 
    ? (subtotal - discountAmount) + (shippingCost || 0) + cardPaymentFee
    : ((subtotal - discountAmount) + (shippingCost || 0) + cardPaymentFee) * 1.21;
    
  // Display Helpers -- Adjusted for discount
  // Note: Discount is usually applied to item prices (subtotal).
  
  const displaySubtotal = isB2B ? subtotal : subtotal * 1.21;
  const displayDiscount = isB2B ? discountAmount : discountAmount * 1.21;
  const displayShipping = isB2B ? (shippingCost || 0) : (shippingCost || 0) * 1.21;
  const displayCardFee = isB2B ? cardPaymentFee : cardPaymentFee * 1.21;
  const displayTax = isB2B ? 0 : tax; // Tax line is redundant in Inc-VAT view usually, or we show full tax breakdown?
  // Header shows: Totaal + (incl. BTW) label.
  
  const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";

  // VAT Validation Handler
  const handleVatBlur = async () => {
      if (!formData.vatNumber) {
          setVatValidationState('idle');
          return;
      }
      
      setVatValidationState('validating');
      // Clear previous VAT error if any from formErrors (though we manage state separately too)
      setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.vatNumber;
          return newErrors;
      });

      const result = await validateVatAction(formData.vatNumber);
      
      if (result.success && result.valid) {
          setVatValidationState('valid');
      } else {
          setVatValidationState('invalid');
          setFormErrors(prev => ({ ...prev, vatNumber: result.message || "Invalid VAT number" }));
      }
  };

  const nextStep = () => {
    if (currentStep === 1) {
        if (!validateStep1()) return;
        // Also block if VAT is invalid (though validateStep1 could check state)
        if (formData.vatNumber && vatValidationState === 'invalid') {
             return;
        }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    const { firstName, lastName, country, street, houseNumber, postcode, city, email } = formData;

    if (!firstName.trim()) errors.firstName = "Voornaam is verplicht";
    if (!lastName.trim()) errors.lastName = "Achternaam is verplicht";
    if (!country) errors.country = "Land is verplicht";
    if (!postcode.trim()) errors.postcode = "Postcode is verplicht";
    if (!houseNumber.trim()) errors.houseNumber = "Huisnummer is verplicht";
    if (!street.trim()) errors.street = "Straat is verplicht";
    if (!city.trim()) errors.city = "Plaats is verplicht";
    if (!email.trim()) {
        errors.email = "E-mail adres is verplicht";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = "Ongeldig e-mail adres";
    }
    
    // Optional VAT check: if filled, must be valid
    if (formData.vatNumber && vatValidationState === 'invalid') {
        errors.vatNumber = formErrors.vatNumber || "Ongeldig BTW-nummer";
    }

    // Shipping Address Validation
    if (shipToDifferentAddress) {
        if (!shippingData.firstName.trim()) errors.shipping_firstName = "Voornaam (verzending) is verplicht";
        if (!shippingData.lastName.trim()) errors.shipping_lastName = "Achternaam (verzending) is verplicht";
        if (!shippingData.country) errors.shipping_country = "Land (verzending) is verplicht";
        if (!shippingData.postcode.trim()) errors.shipping_postcode = "Postcode (verzending) is verplicht";
        if (!shippingData.houseNumber.trim()) errors.shipping_houseNumber = "Huisnummer (verzending) is verplicht";
        if (!shippingData.street.trim()) errors.shipping_street = "Straat (verzending) is verplicht";
        if (!shippingData.city.trim()) errors.shipping_city = "Plaats (verzending) is verplicht";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate Terms
    if (!termsAccepted) {
        toast.error("Je moet akkoord gaan met de algemene voorwaarden om door te gaan.");
        return;
    }
    const hasMaatwerk = cartItems.some(i => i.isMaatwerk);
    if (hasMaatwerk && !maatwerkAccepted) {
        toast.error("Je moet akkoord gaan met de maatwerk voorwaarden om door te gaan.");
        return;
    }
    // hasLengthFreight is defined in component scope but let's re-check or use it
    if (cartItems.some(i => i.hasLengthFreight) && !lengthFreightAccepted) {
        toast.error("Je moet akkoord gaan met de lengtevracht voorwaarden om door te gaan.");
        return;
    }

    setIsLoading(true);
    
    // Construct billing object for WooCommerce
    const billingData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company: formData.companyName,
        address_1: `${formData.street} ${formData.houseNumber}`,
        address_2: formData.apartment,
        city: formData.city,
        state: "", // Add state if needed
        postcode: formData.postcode,
        country: formData.country === "Netherlands" ? "NL" : (formData.country === "Belgium" ? "BE" : "DE"), // Simple mapping
        email: formData.email,
        phone: formData.phone
    };

    const method = validMethods.find(m => m.id === selectedMethodId);

    const shippingObject = shipToDifferentAddress ? {
        first_name: shippingData.firstName,
        last_name: shippingData.lastName,
        company: shippingData.companyName,
        address_1: `${shippingData.street} ${shippingData.houseNumber}`,
        address_2: shippingData.apartment,
        city: shippingData.city,
        state: "",
        postcode: shippingData.postcode,
        country: shippingData.country === "Netherlands" ? "NL" : (shippingData.country === "Belgium" ? "BE" : "DE"),
    } : billingData;

    const orderData = {
        billing: billingData,
        shipping: shippingObject,
        customer_note: orderNotes,
        cart: cartItems,
        payment_method: "mollie",
        shipping_line: method ? [{
             method_id: method.methodId,
             method_title: method.title,
             total: Number(method.cost).toFixed(2),
             tax_status: "taxable",
             tax_class: ""
        }] : [],
        coupon_lines: appliedCoupon ? [{
            code: appliedCoupon.code
        }] : [],
        fee_lines: [
            ...(cardPaymentFee > 0 ? [{
                name: "Betaalkosten (Kaart)",
                total: cardPaymentFee.toFixed(2),
                tax_status: "taxable",
                tax_class: ""
            }] : [])
        ],
        mollie_method_id: selectedPaymentMethod, // Pass selected method
        customer_id: user?.id || 0
    };

    // console.log("🛒 Frontend: Submitting orderData:", orderData);

    const result = await placeOrderAction(orderData);
    
    // console.log("🏁 Frontend: placeOrderAction result:", result);
    
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
      // Clear error when user types
      if (formErrors[field]) {
          setFormErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[field];
              return newErrors;
          });
      }
  };

  const handleShippingChange = (field: string, value: string) => {
      setShippingData(prev => ({ ...prev, [field]: value }));
      const errorKey = `shipping_${field}`;
      if (formErrors[errorKey]) {
          setFormErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[errorKey];
              return newErrors;
          });
      }
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
                        <input type="text" className={`${inputParams} ${formErrors.firstName ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} />
                        {formErrors.firstName && <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>}
                      </div>
                      <div className="form-control">
                        <label className={labelParams}>Achternaam <span className="text-red-500">*</span></label>
                        <input type="text" className={`${inputParams} ${formErrors.lastName ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} />
                        {formErrors.lastName && <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>}
                      </div>
                    </div>

                      {/* Company Name (Optional) */}
                      <div className="form-control">
                        <label className={labelParams}>Bedrijfsnaam (optioneel)</label>
                        <input type="text" className={inputParams} value={formData.companyName} onChange={(e) => handleInputChange("companyName", e.target.value)} />
                      </div>

                     {/* Country */}
                     <div className="form-control">
                        <label className={labelParams}>Land <span className="text-red-500">*</span></label>
                        <select className={`select w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all rounded-lg h-12 font-normal text-base ${formErrors.country ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.country} onChange={(e) => handleInputChange("country", e.target.value)}>
                            <option disabled>Selecteer een land...</option>
                            <option>Netherlands</option>
                            <option>Belgium</option>
                            <option>Germany</option>
                        </select>
                        {formErrors.country && <p className="text-red-500 text-sm mt-1">{formErrors.country}</p>}
                     </div>

                    {/* Street Address */}
                    {/* Postcode & House Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="form-control">
                            <label className={labelParams}>Postcode <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className={`${inputParams} ${formErrors.postcode ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                value={formData.postcode} 
                                onChange={(e) => handleInputChange("postcode", e.target.value)} 
                                placeholder="1234AB"
                                maxLength={6}
                            />
                            {formErrors.postcode && <p className="text-red-500 text-sm mt-1">{formErrors.postcode}</p>}
                        </div>
                         <div className="form-control">
                            <label className={labelParams}>Huisnummer <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className={`${inputParams} ${formErrors.houseNumber ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                value={formData.houseNumber} 
                                onChange={(e) => handleInputChange("houseNumber", e.target.value)} 
                                placeholder="10"
                            />
                            {formErrors.houseNumber && <p className="text-red-500 text-sm mt-1">{formErrors.houseNumber}</p>}
                        </div>
                    </div>
                    
                    {/* PC Check Feedback */}
                     {isCheckingPostcode && <p className="text-sm text-blue-500">Adres controleren...</p>}
                     {postcodeError && <p className="text-sm text-red-500">{postcodeError} - Vul adres handmatig in indien nodig.</p>}

                     {/* Street & City (Auto-filled but editable if needed) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="form-control">
                            <label className={labelParams}>Straat <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className={`${inputParams} ${formData.country === 'Netherlands' ? 'bg-gray-50' : ''} ${formErrors.street ? 'border-red-500 ring-1 ring-red-500' : ''}`} // Visual cue
                                value={formData.street} 
                                onChange={(e) => handleInputChange("street", e.target.value)} 
                                // readOnly={formData.country === 'Netherlands' && !postcodeError}
                            />
                            {formErrors.street && <p className="text-red-500 text-sm mt-1">{formErrors.street}</p>}
                        </div>
                         <div className="form-control">
                            <label className={labelParams}>Plaats <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className={`${inputParams} ${formData.country === 'Netherlands' ? 'bg-gray-50' : ''} ${formErrors.city ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                value={formData.city} 
                                onChange={(e) => handleInputChange("city", e.target.value)} 
                                // readOnly={formData.country === 'Netherlands' && !postcodeError}
                            />
                            {formErrors.city && <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>}
                        </div>
                    </div>

                    <div className="form-control">
                        <label className={labelParams}>Appartement, suite, unit, enz. (optioneel)</label>
                         <input type="text" className={inputParams} value={formData.apartment} onChange={(e) => handleInputChange("apartment", e.target.value)} />
                    </div>

                    {/* Phone & Email */}
                    <div className="form-control">
                      <label className={labelParams}>Telefoon (optioneel)</label>
                      <input type="tel" className={inputParams} value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                    </div>
                    <div className="form-control">
                      <label className={labelParams}>E-mail adres <span className="text-red-500">*</span></label>
                      <input type="email" className={`${inputParams} ${formErrors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                      {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                    </div>

                    {(formData.companyName.trim() !== '' && formData.country !== 'Netherlands') && (
                      <div className="form-control">
                          <label className={labelParams}>BTW nummer (optioneel)</label>
                          <div className="relative">
                              <input 
                                  type="text" 
                                  className={`${inputParams} ${vatValidationState === 'invalid' ? 'border-red-500 ring-1 ring-red-500' : ''} ${vatValidationState === 'valid' ? 'border-green-500 ring-1 ring-green-500' : ''}`} 
                                  value={formData.vatNumber} 
                                  onChange={(e) => {
                                      handleInputChange("vatNumber", e.target.value);
                                      if (vatValidationState !== 'idle') setVatValidationState('idle'); // Reset state on type
                                  }} 
                                  onBlur={handleVatBlur}
                                  placeholder="NL123456789B01"
                              />
                              {vatValidationState === 'validating' && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                  </div>
                              )}
                               {vatValidationState === 'valid' && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      <Check className="w-5 h-5 text-green-500" />
                                  </div>
                              )}
                          </div>
                          {formErrors.vatNumber && <p className="text-red-500 text-sm mt-1">{formErrors.vatNumber}</p>}
                      </div>
                    )}
                  </div>
                  
                  {/* Shipping Address Toggle */}
                  <div className="mt-6 border-t border-gray-100 pt-6">
                     <div className="flex items-center mb-4">
                        <input 
                            type="checkbox" 
                            id="shipToDifferentAddress" 
                            checked={shipToDifferentAddress} 
                            onChange={(e) => setShipToDifferentAddress(e.target.checked)} 
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="shipToDifferentAddress" className="ml-3 text-sm font-semibold text-gray-900 cursor-pointer select-none">
                            Verzenden naar een ander adres?
                        </label>
                     </div>

                     {shipToDifferentAddress && (
                         <div className="space-y-5 animate-in slide-in-from-top-2 fade-in duration-200 pl-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Verzendgegevens</h3>
                            
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="form-control">
                                    <label className={labelParams}>Voornaam <span className="text-red-500">*</span></label>
                                    <input type="text" className={`${inputParams} ${formErrors.shipping_firstName ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={shippingData.firstName} onChange={(e) => handleShippingChange("firstName", e.target.value)} />
                                    {formErrors.shipping_firstName && <p className="text-red-500 text-sm mt-1">{formErrors.shipping_firstName}</p>}
                                </div>
                                <div className="form-control">
                                    <label className={labelParams}>Achternaam <span className="text-red-500">*</span></label>
                                    <input type="text" className={`${inputParams} ${formErrors.shipping_lastName ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={shippingData.lastName} onChange={(e) => handleShippingChange("lastName", e.target.value)} />
                                    {formErrors.shipping_lastName && <p className="text-red-500 text-sm mt-1">{formErrors.shipping_lastName}</p>}
                                </div>
                            </div>

                             <div className="form-control">
                                <label className={labelParams}>Bedrijfsnaam (optioneel)</label>
                                <input type="text" className={inputParams} value={shippingData.companyName} onChange={(e) => handleShippingChange("companyName", e.target.value)} />
                            </div>

                             <div className="form-control">
                                <label className={labelParams}>Land <span className="text-red-500">*</span></label>
                                <select className={`select w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all rounded-lg h-12 font-normal text-base ${formErrors.shipping_country ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={shippingData.country} onChange={(e) => handleShippingChange("country", e.target.value)}>
                                    <option disabled>Selecteer een land...</option>
                                    <option>Netherlands</option>
                                    <option>Belgium</option>
                                    <option>Germany</option>
                                </select>
                                {formErrors.shipping_country && <p className="text-red-500 text-sm mt-1">{formErrors.shipping_country}</p>}
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                 <div className="form-control">
                                    <label className={labelParams}>Postcode <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className={`${inputParams} ${formErrors.shipping_postcode ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        value={shippingData.postcode} 
                                        onChange={(e) => handleShippingChange("postcode", e.target.value)} 
                                        placeholder="1234AB"
                                        maxLength={6}
                                    />
                                    {formErrors.shipping_postcode && <p className="text-red-500 text-sm mt-1">{formErrors.shipping_postcode}</p>}
                                </div>
                                 <div className="form-control">
                                    <label className={labelParams}>Huisnummer <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className={`${inputParams} ${formErrors.shipping_houseNumber ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        value={shippingData.houseNumber} 
                                        onChange={(e) => handleShippingChange("houseNumber", e.target.value)} 
                                        placeholder="10"
                                    />
                                    {formErrors.shipping_houseNumber && <p className="text-red-500 text-sm mt-1">{formErrors.shipping_houseNumber}</p>}
                                </div>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                               <div className="form-control">
                                    <label className={labelParams}>Straat <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className={`${inputParams} ${formErrors.shipping_street ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        value={shippingData.street} 
                                        onChange={(e) => handleShippingChange("street", e.target.value)} 
                                    />
                                    {formErrors.shipping_street && <p className="text-red-500 text-sm mt-1">{formErrors.shipping_street}</p>}
                                </div>
                                 <div className="form-control">
                                    <label className={labelParams}>Plaats <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className={`${inputParams} ${formErrors.shipping_city ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        value={shippingData.city} 
                                        onChange={(e) => handleShippingChange("city", e.target.value)} 
                                    />
                                    {formErrors.shipping_city && <p className="text-red-500 text-sm mt-1">{formErrors.shipping_city}</p>}
                                </div>
                            </div>

                            <div className="form-control">
                                <label className={labelParams}>Appartement, suite, unit, enz. (optioneel)</label>
                                 <input type="text" className={inputParams} value={shippingData.apartment} onChange={(e) => handleShippingChange("apartment", e.target.value)} />
                            </div>
                         </div>
                     )}
                  </div>
                  
                  {/* Order Notes */}
                  <div className="my-4 border-t border-gray-100 pt-4">
                      <div className="form-control">
                        <label className={labelParams}>Bestelnotities (optioneel)</label>
                        <textarea 
                            className={`${inputParams} h-24 py-3`} 
                            placeholder="Notities over uw bestelling, bijvoorbeeld speciale instructies voor levering."
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                        />
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
                                            <div className="text-sm text-gray-500">
                                                {(method.methodId === 'length_freight' || method.title.toLowerCase().includes('lengtevracht'))
                                                    ? 'Dit product wordt verstuurd via lengtevracht. Deze plannen wij na overleg met u in op een werkdag naar keuze. Het tijdsvak is tussen 09:00 en 17:00. U dient thuis te zijn (of lever het af bij werk waar altijd iemand aanwezig is). Indien u de levering niet aan kunt nemen wordt er €59,90 extra in rekening gebracht (retour naar ons, en weer naar u).' 
                                                    : 'De order wordt verzonden via DHL of GLS, waarbij indien mogelijk wordt gebruikt van brievenbuspost.'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                        {method.cost === 0 ? "Kosteloos" : `€${(isB2B ? method.cost : method.cost * 1.21).toFixed(2)}`}
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
                    {/* <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-500 mb-6">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-semibold">Betaling</p>
                        <p className="text-sm">Kies een betaalmethode om je bestelling af te ronden.</p>
                    </div> */}

                    <div className="space-y-3 mb-6">
                        {paymentMethods.length === 0 ? (
                             <p className="text-gray-500 text-center py-4">Betaalmethoden laden...</p>
                        ) : (
                            paymentMethods.map((method) => (
                                <div 
                                    key={method.id}
                                    onClick={() => setSelectedPaymentMethod(method.id)} 
                                    className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${selectedPaymentMethod === method.id ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-1 bg-white rounded-md border border-gray-100 w-12 h-8 flex items-center justify-center">
                                            {method.image?.svg ? (
                                                <img src={method.image.svg} alt={method.description} className="max-w-full max-h-full" />
                                            ) : method.image?.size1x ? (
                                                <img src={method.image.size1x} alt={method.description} className="max-w-full max-h-full" />
                                            ) : (
                                                <CreditCard className="w-5 h-5 text-gray-400"/>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{method.description}</span>
                                            {method.id === 'creditcard' && (
                                                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">+2.5%</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPaymentMethod === method.id ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                                        {selectedPaymentMethod === method.id && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                     <div className="flex items-center mb-6 px-1">
                        <input 
                            type="checkbox" 
                            id="terms" 
                            checked={termsAccepted} 
                            onChange={(e) => setTermsAccepted(e.target.checked)} 
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="terms" className="ml-3 text-sm text-gray-700 cursor-pointer select-none">
                            Ik ga akkoord met de <a href="/algemene-voorwaarden" target="_blank" className="text-blue-600 hover:text-blue-800 underline">algemene voorwaarden</a>
                        </label>
                     </div>

                     {/* Maatwerk Checkbox logic */}
                     {(() => {
                        const hasMaatwerkItems = cartItems.some(i => i.isMaatwerk);
                        return hasMaatwerkItems ? (
                             <div className="flex items-start mb-6 px-1">
                                <input 
                                    type="checkbox" 
                                    id="maatwerk-terms" 
                                    checked={maatwerkAccepted} 
                                    onChange={(e) => setMaatwerkAccepted(e.target.checked)} 
                                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer mt-0.5"
                                />
                                <label htmlFor="maatwerk-terms" className="ml-3 text-sm text-gray-700 cursor-pointer select-none">
                                    Ik begrijp dat mijn winkelwagen maatwerk producten bevat die zijn uitgesloten van retourrecht.
                                </label>
                             </div>
                        ) : null;
                     })()}

                     {/* Length Freight Checkbox logic */}
                     {(() => {
                        return hasLengthFreight ? (
                             <div className="flex items-start mb-6 px-1">
                                <input 
                                    type="checkbox" 
                                    id="length-freight-terms" 
                                    checked={lengthFreightAccepted} 
                                    onChange={(e) => setLengthFreightAccepted(e.target.checked)} 
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer mt-0.5"
                                />
                                <label htmlFor="length-freight-terms" className="ml-3 text-sm text-gray-700 cursor-pointer select-none">
                                    Ik begrijp dat er extra kosten aan zijn verbonden als ik tijdens de bezorgpoging niet thuis ben.
                                </label>
                             </div>
                        ) : null;
                     })()}

                    <div className="relative group w-full">
                        <button 
                            onClick={handlePlaceOrder}
                            disabled={isLoading || !selectedPaymentMethod || !termsAccepted || (cartItems.some(i => i.isMaatwerk) && !maatwerkAccepted) || (hasLengthFreight && !lengthFreightAccepted)}
                            className={`w-full btn btn-primary border-none h-14 rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-2 
                                ${(!selectedPaymentMethod || !termsAccepted || (cartItems.some(i => i.isMaatwerk) && !maatwerkAccepted) || (hasLengthFreight && !lengthFreightAccepted)) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'}
                            `}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : `Bevestig & Betalen €${total.toFixed(2)}`}
                        </button>
                        
                        {/* Tooltip for Terms Check */}
                        {selectedPaymentMethod && (!termsAccepted || (cartItems.some(i => i.isMaatwerk) && !maatwerkAccepted) || (hasLengthFreight && !lengthFreightAccepted)) && (
                           <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 hidden group-hover:block w-full z-10">
                               <div className="bg-black text-white text-xs rounded py-1 px-2 text-center shadow-lg relative max-w-xs mx-auto">
                                   {!termsAccepted ? "Accepteer de algemene voorwaarden om door te gaan" : ((cartItems.some(i => i.isMaatwerk) && !maatwerkAccepted) ? "Accepteer de maatwerk voorwaarden om door te gaan" : "Accepteer de lengtevracht voorwaarden om door te gaan")}
                                   <div className="absolute top-100 left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></div>
                               </div>
                           </div>
                        )}
                        
                        {/* Tooltip for Payment Method (Optional) */}
                        {!selectedPaymentMethod && (
                           <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 hidden group-hover:block w-full z-10">
                               <div className="bg-black text-white text-xs rounded py-1 px-2 text-center shadow-lg relative max-w-xs mx-auto">
                                   Selecteer een betaalmethode
                                   <div className="absolute top-100 left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></div>
                               </div>
                           </div>
                        )}
                    </div>
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
                        <div className="w-16 h-16 bg-white rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                             {item.slug ? (
                                <Link href={`/${item.slug}`} className="block w-full h-full">
                                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" /> : <Package className="w-8 h-8 text-gray-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />}
                                </Link>
                             ) : (
                                item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" /> : <Package className="w-8 h-8 text-gray-300" />
                             )}
                        </div>
                        <div className="flex-1 flex justify-between">
                            <div>
                                {item.slug ? (
                                    <Link href={`/${item.slug}`} className="hover:text-blue-600 transition-colors">
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                                    </Link>
                                ) : (
                                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                                )}
                                <p className="text-sm text-gray-500 mt-1">× {item.quantity}</p>
                                
                                {(() => {
                                    // Calculate delivery info for Checkout
                                    const info = getDeliveryInfo(
                                        item.stockStatus || 'instock',
                                        item.quantity,
                                        item.stockQuantity !== undefined ? item.stockQuantity : null,
                                        item.leadTimeInStock || 1,
                                        item.leadTimeNoStock || 30
                                    );
                                    
                                    // Determine color based on type
                                    let colorClass = "text-[#03B955]";
                                    if (info.type === "PARTIAL_STOCK") colorClass = "text-[#B28900]";
                                    else if (info.type === "BACKORDER" || info.type === "OUT_OF_STOCK") colorClass = "text-[#FF5E00]";

                                    return (
                                        <p className={`text-xs ${colorClass} mt-1 font-semibold`}>
                                            {info.short}
                                        </p>
                                    );
                                })()}
                                {item.isMaatwerk && (
                                    <p className="text-xs text-amber-600 mt-1 font-medium">Let op: maatwerk product. Uitgesloten van retourrecht</p>
                                )}
                                {item.hasLengthFreight && (
                                     <div className="flex items-start gap-1 mt-1">
                                        <Truck className="w-3 h-3 text-blue-600 mt-0.5" />
                                        <p className="text-xs text-blue-600 font-medium">Lengtevracht toeslag</p>
                                    </div>
                                )}
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



                    {/* Coupon Section */}
                     <div className="border-b border-gray-100 pb-4 mb-2">
                        {!appliedCoupon ? (
                            <div className="mt-2">
                                <button
                                    onClick={() => setIsCouponOpen(!isCouponOpen)}
                                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    <Tag className="w-4 h-4" />
                                    {isCouponOpen ? "Sluiten" : "Heb je een kortingscode?"}
                                </button>
                                
                                {isCouponOpen && (
                                    <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                placeholder="Code invullen"
                                                className="input input-sm flex-1 bg-gray-50 border-gray-300 focus:border-blue-500 rounded-lg h-10"
                                                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={isCouponLoading || !couponCode}
                                                className="btn btn-sm bg-gray-900 text-white border-none hover:bg-black h-10 px-4 rounded-lg"
                                            >
                                                {isCouponLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Toepassen"}
                                            </button>
                                        </div>
                                        {couponMessage && (
                                            <p className={`text-xs mt-2 ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                                {couponMessage.text}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="mt-2 bg-green-50 border border-green-100 rounded-lg p-3 flex justify-between items-center">
                                 <div>
                                    <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                                        <Tag className="w-4 h-4" />
                                        <span>Coupon: {appliedCoupon.code}</span>
                                    </div>
                                    <div className="text-xs text-green-600 mt-0.5">
                                        {appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.amount}% korting` : `€${appliedCoupon.amount} korting`}
                                    </div>
                                 </div>
                                 <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                    <X className="w-4 h-4" />
                                 </button>
                             </div>
                        )}
                    </div>

                    {appliedCoupon && (
                        <div className="flex justify-between text-base text-green-600 font-medium">
                            <span>Korting</span>
                            <span>- € {displayDiscount.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base text-gray-600">
                        <span>Verzending</span>
                        <span className="font-medium text-gray-900">
                            {shippingCost === null ? "Wordt berekend" : (shippingCost === 0 ? "Kosteloos" : `€ ${displayShipping.toFixed(2).replace('.', ',')}`)}
                        </span>
                    </div>
                    {cardPaymentFee > 0 && (
                        <div className="flex justify-between text-base text-orange-600">
                            <span>Betaalkosten (Kaart)</span>
                            <span className="font-medium">€ {displayCardFee.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                     {/* Show Tax breakdown if needed, or total tax amount? Header handles it by showing total + label */}
                    <div className="flex justify-between text-base text-gray-600">
                        <span>BTW (21%)</span>
                         {/* Calculate actual tax amount for the whole order including card fee and freight */}
                         {/* Freight Ex VAT = lengthFreightCost / 1.21 */}
                        <span className="font-medium text-gray-900">€ {(((subtotal - discountAmount) + (shippingCost || 0) + cardPaymentFee) * 0.21).toFixed(2).replace('.', ',')}</span>
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
