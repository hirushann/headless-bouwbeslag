import React from 'react';
import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <main className="font-sans bg-[#F5F5F5] min-h-[65vh] flex items-center justify-center p-5">
      <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-lg w-full">
        <div className="mb-6 flex justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#03B955" className="size-20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
             </svg>
        </div>
        <h1 className="text-3xl font-bold text-[#1C2630] mb-4">Bedankt voor je aanvraag!</h1>
        <p className="text-[#3D4752] text-lg mb-8">
          We hebben je gegevens ontvangen. We controleren de prijs en nemen zo snel mogelijk contact met je op.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-[#0066FF] text-white font-bold py-3 px-8 rounded-sm hover:bg-[#0052CC] transition-colors"
        >
          Terug naar de winkel
        </Link>
      </div>
    </main>
  );
}
