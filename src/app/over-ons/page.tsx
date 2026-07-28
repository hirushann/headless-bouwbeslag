import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { generateBreadcrumbSchema } from '@/lib/schemaUtils';

export const metadata: Metadata = {
  title: 'Over Ons | Bouwbeslag',
  description: 'Leer meer over Bouwbeslag.nl — uw betrouwbare partner voor kwalitatief bouwbeslag en deurbeslag. Ontdek wie we zijn, wat we doen en waarom klanten voor ons kiezen.',
  alternates: {
    canonical: '/over-ons',
  },
};

export default function OverOnsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Bouwbeslag",
    legalName: "DayZ Solutions",
    url: siteUrl,
    logo: `${siteUrl}/footerlogo.webp`,
    description: "Bouwbeslag.nl is dé online specialist in hoogwaardig bouwbeslag, deurbeslag en raambeslag. Wij bieden een uitgebreid assortiment van topmerken tegen scherpe prijzen.",
    foundingDate: "2020",
    email: "contact@bouwbeslag.nl",
    telephone: "+31578760508",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NL",
    },
    taxID: "NL003174000B88",
    sameAs: [
      "https://wa.me/31578760508",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+31578760508",
      contactType: "customer service",
      email: "contact@bouwbeslag.nl",
      availableLanguage: ["Dutch"],
    },
  };

  const breadcrumbData = generateBreadcrumbSchema([
    { name: "Home", url: `${siteUrl}` },
    { name: "Over Ons", url: `${siteUrl}/over-ons` },
  ]);

  return (
    <main className="font-sans bg-[#F5F5F5] min-h-screen py-10 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, breadcrumbData]).replace(/</g, '\\u003c'),
        }}
      />

      <div className="max-w-[1440px] mx-auto px-5 lg:px-0">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
          <Link href="/" className="hover:underline flex items-center gap-1 text-black">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>Home</span>
          </Link>{" "}
          / <span>Over Ons</span>
        </div>

        {/* Hero */}
        <h1 className="text-3xl lg:text-5xl font-bold mb-4 text-[#1C2630]">Over Bouwbeslag</h1>
        <p className="text-[#3D4752] text-lg max-w-3xl mb-12">
          Uw betrouwbare partner voor kwalitatief bouwbeslag, deurbeslag en raambeslag in Nederland.
        </p>

        {/* Wie Zijn Wij */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          <div className="bg-white p-8 lg:p-10 rounded-lg shadow-sm">
            <div className="bg-[#E6F0FF] p-3 rounded-full w-max mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#1C2630] mb-4">Wie zijn wij?</h2>
            <p className="text-[#3D4752] leading-relaxed mb-4">
              Bouwbeslag.nl is dé online specialist in hoogwaardig bouwbeslag. Wij zijn onderdeel van DayZ Solutions en leveren
              een uitgebreid assortiment deurbeslag, raambeslag, scharnieren, sloten en bijbehorende accessoires van topmerken.
            </p>
            <p className="text-[#3D4752] leading-relaxed">
              Ons team bestaat uit gepassioneerde vakmensen die dagelijks klaarstaan om particulieren, aannemers en projectontwikkelaars
              te voorzien van het juiste beslag. Of u nu een deurkruk zoekt voor uw nieuwe woning of beslag nodig heeft voor een groot bouwproject — bij ons bent u aan het juiste adres.
            </p>
          </div>

          <div className="bg-white p-8 lg:p-10 rounded-lg shadow-sm">
            <div className="bg-[#E6F0FF] p-3 rounded-full w-max mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#1C2630] mb-4">Onze missie</h2>
            <p className="text-[#3D4752] leading-relaxed mb-4">
              Wij geloven dat iedereen toegang moet hebben tot kwalitatief bouwbeslag tegen eerlijke prijzen. Daarom bieden wij
              een breed assortiment van alleen de beste merken, gecombineerd met uitstekende service en snelle levering.
            </p>
            <p className="text-[#3D4752] leading-relaxed">
              Onze missie is simpel: het gemakkelijk maken om het juiste beslag te vinden en te bestellen.
              Met onze uitgebreide productkennis en klantgerichte aanpak streven we ernaar om elke klant tevreden te stellen.
            </p>
          </div>
        </div>

        {/* Waarom Bouwbeslag */}
        <div className="mb-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1C2630] mb-8 text-center">Waarom kiezen voor Bouwbeslag?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-[#E6F0FF] p-4 rounded-full w-max mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1C2630] mb-2">Alleen kwaliteitsmerken</h3>
              <p className="text-[#3D4752] text-sm">
                Wij werken uitsluitend met gerenommeerde merken die staan voor kwaliteit en duurzaamheid.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-[#E6F0FF] p-4 rounded-full w-max mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1C2630] mb-2">Gegarandeerd de goedkoopste</h3>
              <p className="text-[#3D4752] text-sm">
                Dankzij onze directe relaties met fabrikanten bieden wij altijd de scherpste prijzen in de markt.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-[#E6F0FF] p-4 rounded-full w-max mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.137-.502 1.105-1.122-.065-1.228-.317-2.413-.737-3.527a1.125 1.125 0 0 0-.83-.662l-2.475-.412a.999.999 0 0 1-.712-.538l-1.17-2.34A1.125 1.125 0 0 0 14.78 9.75H8.25m0 0H3.375a1.125 1.125 0 0 0-1.125 1.125v4.875" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1C2630] mb-2">Snelle levering</h3>
              <p className="text-[#3D4752] text-sm">
                Vóór 16:00 uur besteld? Dan wordt uw bestelling dezelfde dag nog verzonden.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-[#E6F0FF] p-4 rounded-full w-max mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M21.015 4.356v4.992" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1C2630] mb-2">30 dagen retourrecht</h3>
              <p className="text-[#3D4752] text-sm">
                Niet tevreden? Geen probleem. U kunt uw bestelling binnen 30 dagen kosteloos retourneren.
              </p>
            </div>

          </div>
        </div>

        {/* Bedrijfsgegevens */}
        <div className="bg-white p-8 lg:p-10 rounded-lg shadow-sm mb-16">
          <h2 className="text-2xl font-bold text-[#1C2630] mb-6">Bedrijfsgegevens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            <div className="flex items-start gap-4">
              <div className="bg-[#E6F0FF] p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                </svg>
              </div>
              <div>
                <p className="text-[#1C2630] font-semibold text-lg">Bedrijfsnaam</p>
                <p className="text-[#3D4752]">Bouwbeslag.nl</p>
                <p className="text-[#3D4752] text-sm">Onderdeel van DayZ Solutions</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#E6F0FF] p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-[#1C2630] font-semibold text-lg">E-mail</p>
                <a href="mailto:contact@bouwbeslag.nl" className="text-[#0050D1] hover:underline">contact@bouwbeslag.nl</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#E6F0FF] p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <div>
                <p className="text-[#1C2630] font-semibold text-lg">Telefoon</p>
                <a href="tel:0031578760508" className="text-[#0050D1] hover:underline">0578-760508</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#E6F0FF] p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <p className="text-[#1C2630] font-semibold text-lg">KVK-nummer</p>
                <p className="text-[#3D4752]">77245350</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#E6F0FF] p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <p className="text-[#1C2630] font-semibold text-lg">BTW-nummer</p>
                <p className="text-[#3D4752]">NL003174000B88</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#E6F0FF] p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0066FF" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-[#1C2630] font-semibold text-lg">Land</p>
                <p className="text-[#3D4752]">Nederland</p>
              </div>
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#0066FF] rounded-lg p-8 lg:p-12 text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Heeft u vragen? Neem contact met ons op!
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Ons team staat klaar om u te helpen met al uw vragen over bouwbeslag. Wij reageren meestal binnen 24 uur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-[#0066FF] font-bold py-4 px-8 rounded-sm hover:bg-gray-100 transition-colors"
            >
              Contact opnemen
            </Link>
            <a
              href="tel:0031578760508"
              className="border-2 border-white text-white font-bold py-4 px-8 rounded-sm hover:bg-white/10 transition-colors"
            >
              Bel ons: 0578-760508
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
