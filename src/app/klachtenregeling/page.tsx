import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Klachtenregeling | Bouwbeslag',
  description: 'Heeft u een klacht? Lees hier hoe wij klachten afhandelen en waar u terecht kunt.',
};

export default function ComplaintsPolicyPage() {
  return (
    <main className="max-w-[1440px] mx-auto px-5 lg:px-0 py-10 lg:py-20">
      <h1 className="text-3xl lg:text-4xl font-bold mb-6 text-[#1C2630]">Klachtenregeling</h1>
      
      <div className="prose max-w-none text-[#1C2630] space-y-6">
        <p className="text-lg leading-relaxed">
          Het kan altijd voorkomen dat er iets niet helemaal gaat zoals gepland. We raden u aan om klachten eerst bij ons kenbaar te maken door te mailen naar <strong>contact@bouwbeslag.nl</strong>.
        </p>

        <p className="text-lg leading-relaxed">
          Leidt dit niet tot een oplossing, dan is het mogelijk om uw geschil aan te melden voor bemiddeling via <strong>WebwinkelKeur</strong> via <a href="https://www.webwinkelkeur.nl/kennisbank/consumenten/geschil" target="_blank" rel="noopener noreferrer" className="text-[#0066FF] hover:underline font-medium">deze link</a>.
        </p>
      </div>
    </main>
  );
}
