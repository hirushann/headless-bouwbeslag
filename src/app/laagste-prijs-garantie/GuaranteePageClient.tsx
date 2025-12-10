'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function GuaranteePageClient({ 
  initialProductLink 
}: { 
  initialProductLink: string 
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <main className="font-sans bg-[#F5F5F5] min-h-screen py-10 lg:py-20">
      <motion.div 
        className="max-w-[1440px] mx-auto px-5 lg:px-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          variants={itemVariants}
          className="text-3xl lg:text-4xl font-bold mb-4 text-[#1C2630] text-center lg:text-left"
        >
          Altijd de laagste prijs. Gegarandeerd.
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-[#3D4752] mb-10 text-center lg:text-left text-lg max-w-3xl"
        >
          Vind je hetzelfde product elders goedkoper bij welke winkel of webshop in de Benelux dan ook? Dan passen wij de prijs meteen aan.
        </motion.p>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Text Content */}
          <motion.div 
            variants={itemVariants}
            className="lg:w-1/2 flex flex-col gap-8"
          >
            <div className="bg-white p-8 rounded-lg shadow-sm">
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1C2630] mb-4">Waarom we deze garantie geven</h2>
                <ul className="list-disc pl-5 space-y-2 text-[#3D4752]">
                  <li>We onderhandelen direct met fabrikanten.</li>
                  <li>We optimaliseren voorraad & logistiek (dus lagere kosten).</li>
                  <li>We willen dat klanten nooit twijfelen of een product goedkoper kan.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1C2630] mb-4">Hoe werkt onze Laagste Prijs Garantie?</h2>
                <div className="space-y-4 text-[#3D4752]">
                  <div>
                    <strong className="block text-[#1C2630] mb-1">Je ziet een lagere prijs bij een andere webshop in de Benelux</strong>
                    <p>Stuur ons de link of screenshot via het formulier.</p>
                  </div>
                  <div>
                    <strong className="block text-[#1C2630] mb-1">Wij passen de prijs aan</strong>
                    <p>En je krijgt een kortingscode voor 10% + je bestelt voor de laagste prijs.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1C2630] mb-4">Voorwaarden</h2>
                <ul className="list-disc pl-5 space-y-2 text-[#3D4752]">
                  <li>Wij moeten op onze productpagina van het betreffende product een "laagste prijs" badge tonen.</li>
                  <li>Het moet gaan om exact hetzelfde product (merk, type, kleur, maat).</li>
                  <li>De webshop moet binnen de Benelux gevestigd zijn.</li>
                  <li>De lagere prijs moet momenteel geldig zijn.</li>
                  <li>Prijsverschillen door fouten of aanbiedingen met beperkte voorraad tellen niet mee.</li>
                </ul>
              </section>

            </div>
          </motion.div>

          {/* Form */}
          <motion.div 
            variants={itemVariants}
            className="lg:w-1/2"
          >
            <div className="bg-white p-8 rounded-lg shadow-sm sticky top-10">
              <h2 className="text-2xl font-semibold text-[#1C2630] mb-6">Laagste prijs claimen</h2>
              <form className="flex flex-col gap-6">
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-[#1C2630] font-medium">Naam</label>
                  <input 
                    type="text" 
                    id="name" 
                    required
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                    placeholder="Uw naam"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-[#1C2630] font-medium">E-mail</label>
                  <input 
                    type="email" 
                    id="email" 
                    required
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                    placeholder="uw@email.nl"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="productLink" className="text-[#1C2630] font-medium">Productlink op onze site</label>
                  <input 
                    type="url" 
                    id="productLink" 
                    required
                    defaultValue={initialProductLink}
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                    placeholder="https://bouwbeslag.nl/..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="competitorLink" className="text-[#1C2630] font-medium">Link naar goedkopere aanbieder</label>
                  <input 
                    type="url" 
                    id="competitorLink" 
                    required
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                    placeholder="https://concurrent.nl/..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="comments" className="text-[#1C2630] font-medium">Opmerking (optioneel)</label>
                  <textarea 
                    id="comments" 
                    rows={4}
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors resize-none"
                    placeholder="Extra informatie..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="bg-[#0066FF] text-white font-bold py-4 px-8 rounded-sm hover:bg-[#0052CC] transition-colors w-full mt-2"
                >
                  Controleer prijs
                </button>

              </form>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </main>
  );
}
