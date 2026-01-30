'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function GuaranteePageClient({ 
  initialProductLink 
}: { 
  initialProductLink: string 
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form handling
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        productLink: formData.get('productLink'),
        competitorLink: formData.get('competitorLink'),
        comments: formData.get('comments'),
    };

    try {
        const response = await fetch('/api/contact/lowest-price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            router.push('/laagste-prijs-garantie/bedankt');
        } else {
            toast.error(result.error || 'Er ging iets mis. Probeer het opnieuw.');
        }
    } catch (error) {
        // console.error('Submission error:', error);
        toast.error('Er ging iets mis bij het versturen.');
    } finally {
        setIsSubmitting(false);
    }
  };
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
              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-[#1C2630] font-medium">Naam</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
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
                    name="email"
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
                    name="productLink"
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
                    name="competitorLink"
                    required
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors"
                    placeholder="https://concurrent.nl/..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="comments" className="text-[#1C2630] font-medium">Opmerking (optioneel)</label>
                  <textarea 
                    id="comments" 
                    name="comments"
                    rows={4}
                    className="border border-[#DBE3EA] rounded-sm px-4 py-3 focus:outline-none focus:border-[#0066FF] transition-colors resize-none"
                    placeholder="Extra informatie..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`bg-[#0066FF] text-white font-bold py-4 px-8 rounded-sm hover:bg-[#0052CC] transition-colors w-full mt-2 flex justify-center items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : (
                    "Controleer prijs"
                  )}
                </button>

              </form>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </main>
  );
}
