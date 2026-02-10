import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Retourbeleid | Bouwbeslag',
  description: 'Lees hier alles over ons retourbeleid en hoe u uw producten kunt retourneren.',
  alternates: {
    canonical: '/retourbeleid',
  },
};

export default function ReturnPolicyPage() {
  return (
    <main className="max-w-[1440px] mx-auto px-5 lg:px-0 py-10 lg:py-20">
      <h1 className="text-3xl lg:text-4xl font-bold mb-6 text-[#1C2630]">Retourbeleid</h1>
      
      <div className="prose max-w-none text-[#1C2630] space-y-6">
        <p className="text-lg leading-relaxed">
          Terugsturen mag binnen <strong>60 dagen</strong> na ontvangst van de goederen. Uitgezonderd zijn maatwerk artikelen, indien hier sprake van is wordt dit is altijd duidelijk aangegeven op de productpagina, in de winkelwagen, op de afrekenpagina, in de bevestigingsmail en op de pakbon.
        </p>

        <div className="bg-gray-50 p-6 rounded-sm border border-gray-100">
          <p className="mb-4">
            Retourneren is op eigen kosten. Ook hier zijn we transparant over op deze pagina en in onze algemene voorwaarden. Je kunt de retour sturen naar:
          </p>
          <div className="font-semibold text-[#1C2630] bg-white p-4 border border-gray-200 w-fit rounded-sm">
            <p>Bouwbeslag.nl</p>
            <p>t.a.v. “ordernummer”</p>
            <p>Oenerweg 30</p>
            <p>8181RJ Heerde</p>
          </div>
        </div>

        <p className="bg-amber-50 text-amber-900 p-4 border-l-4 border-amber-400 font-medium">
          Als het ordernummer niet op adressticker of in de doos vermeldt wordt kunnen wij de retour niet behandelen.
        </p>

        <div className="border border-blue-100 p-6 rounded-sm">
          <h2 className="text-xl font-bold mb-3 text-[#0066FF]">Handig: Retouren via DHL (Zonder printen)</h2>
          <p>
            Wij kunnen je ook een <strong>QR code van DHL</strong> mailen. Die kun je bij ieder DHL punt laten scannen, zonder iets te printen. 
            <br /><br />
            <span className="text-sm text-gray-600 italic">
              Let op: Als je deze QR code gebruikt wordt trekken wij €6,95 van creditering af.
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
