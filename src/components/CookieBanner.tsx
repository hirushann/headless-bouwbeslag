"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already made a choice
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShowBanner(false);
    // Dispatch a custom event so Google Tag Manager knows it can load immediately
    window.dispatchEvent(new Event("cookie_consent_accepted"));
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[99999] flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex-1 text-sm text-gray-700">
        <h3 className="font-bold text-base mb-1 text-gray-900">Wij gebruiken cookies</h3>
        <p>
          We gebruiken cookies om uw ervaring op onze website te verbeteren, ons verkeer te analyseren en voor marketingdoeleinden. 
          Noodzakelijke cookies voor het functioneren van de winkel (zoals uw winkelwagen) worden altijd geplaatst. 
          Lees meer hierover in onze <Link href="/privacy-policy" className="text-[#0066FF] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
      <div className="flex gap-3 w-full md:w-auto shrink-0">
        <button 
          onClick={handleReject}
          className="flex-1 md:flex-none px-6 py-2.5 border border-[#D7DCE2] rounded-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Weigeren
        </button>
        <button 
          onClick={handleAccept}
          className="flex-1 md:flex-none px-6 py-2.5 bg-[#0066FF] rounded-sm text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Accepteren
        </button>
      </div>
    </div>
  );
}
