
"use client";

import { useCartStore } from "@/lib/cartStore";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { checkOrderStatusAction } from "@/app/new-checkout/actions";
import { useRouter } from "next/navigation";

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
            console.error(error);
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
                <Link href="/new-checkout" className="bg-[#0066FF] text-white font-bold px-6 py-3 rounded-md hover:bg-blue-700 transition">
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
                <Link href="/new-checkout" className="bg-[#0066FF] text-white font-bold px-6 py-3 rounded-md hover:bg-blue-700 transition">
                    Probeer opnieuw
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-green-100 p-6 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-16 h-16 text-green-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold mb-2">Bedankt voor je bestelling!</h1>
      {orderId && <p className="text-gray-600 mb-6">Order nummer: #{orderId}</p>}
      
      <p className="max-w-md text-gray-500 mb-8">
        We hebben je bestelling in goede orde ontvangen. Je ontvangt binnen enkele minuten een bevestiging per e-mail.
      </p>

      <div className="flex gap-4">
        <Link href="/" className="bg-[#0066FF] text-white font-bold px-6 py-3 rounded-md hover:bg-blue-700 transition">
          Terug naar Home
        </Link>
        <Link href="/account?tab=orders" className="border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-md hover:bg-gray-50 transition">
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
