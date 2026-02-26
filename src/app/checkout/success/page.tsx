"use client";

import { useCartStore } from "@/lib/cartStore";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { checkOrderStatusAction } from "@/app/checkout/actions";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import successAnimation from "../../../../public/Done.json";

function SuccessContent() {
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
        setStatus('failed');
        setLoading(false);
        return;
    }

    const verifyOrder = async () => {
        try {
            const result = await checkOrderStatusAction(parseInt(orderId));
            
            if (result.success) {
                const s = result.status;
                if (['processing', 'completed', 'on-hold'].includes(s)) {
                    setStatus('success');
                    clearCart(); // Only clear on success
                } else if (s === 'cancelled') {
                    setStatus('cancelled');
                } else if (s === 'failed') {
                    setStatus('failed');
                } else {
                    // pending or other
                     setStatus('success'); // Treat pending as received for now
                     clearCart();
                }
            } else {
                setStatus('failed');
            }
        } catch (error) {
            // console.error(error);
            setStatus('failed');
        } finally {
            setLoading(false);
        }
    };

    verifyOrder();
  }, [orderId, clearCart]);

  if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="loading loading-spinner loading-lg text-blue-600"></div>
            <p className="mt-4 text-gray-500">Bestelling verifiëren...</p>
        </div>
      );
  }

  if (status === 'cancelled') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-yellow-100 p-6 rounded-full mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-16 h-16 text-yellow-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Betaling Geannuleerd</h1>
            <p className="text-gray-600 mb-6">De betaling voor order #{orderId} is geannuleerd.</p>
            
            <div className="flex gap-4">
                <Link href="/checkout" className="bg-[#0066FF] text-white font-bold px-6 py-3 rounded-md hover:bg-blue-700 transition">
                    Probeer opnieuw
                </Link>
                <Link href="/" className="border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-md hover:bg-gray-50 transition">
                    Terug naar Home
                </Link>
            </div>
        </div>
      );
  }

  if (status === 'failed') {
       return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-red-100 p-6 rounded-full mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-16 h-16 text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Betaling Mislukt</h1>
            <p className="text-gray-600 mb-6">Er is iets misgegaan met de betaling of de order verificatie.</p>
            {orderId && <p className="text-sm text-gray-500 mb-6">Order: #{orderId}</p>}

             <div className="flex gap-4">
                <Link href="/checkout" className="bg-[#0066FF] text-white font-bold px-6 py-3 rounded-md hover:bg-blue-700 transition">
                    Probeer opnieuw
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center bg-[url('/thankyoubg.png')] bg-cover bg-center-top bg-no-repeat w-full">
      <div className="w-48 h-48 mb-6 pointer-events-none">
         <Lottie 
            animationData={successAnimation} 
            loop={true} 
            autoplay={true} 
         />
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-[#1C2530] mb-4 tracking-tight">
        Hoera, je bestelling is gelukt! 🎉
      </h1>
      
      <p className="text-lg md:text-xl text-gray-700 font-medium mb-3">
        Bedankt voor het vertrouwen in ons. We gaan direct voor je aan de slag!
      </p>
      
      {orderId && (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-100 px-6 py-3 rounded-xl shadow-sm mb-6 inline-block">
          <p className="text-gray-600 font-medium">
            Jouw ordernummer is <span className="text-[#0066FF] font-bold text-lg inline-block ml-1">#{orderId}</span>
          </p>
        </div>
      )}
      
      <p className="max-w-lg text-gray-500 text-center mb-10 leading-relaxed">
        Binnen enkele minuten ontvang je van ons een bevestigingsmail met alle details. 
        Zodra we je pakketje meegeven aan de bezorger, hoor je weer van ons.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="bg-[#0066FF] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-700 hover:scale-[1.02] transform transition-all shadow-md flex items-center justify-center gap-2">
          Verder winkelen
        </Link>
        <Link href="/account?tab=orders" className="bg-white border border-gray-200 shadow-sm text-gray-700 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
          Bekijk bestelling
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex justify-center items-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
