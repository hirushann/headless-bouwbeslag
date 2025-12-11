"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function WarrantyRequestPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    purchaseDate: "",
    productName: "",
    description: "",
    images: [] as File[],
    confirmed: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({ ...prev, images: Array.from(e.target.files!) }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, confirmed: e.target.checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.confirmed) return;
    // Mock submission
    setSubmitted(true);
  };

  const faqs = [
    {
      question: "Hoe lang duurt een beoordeling?",
      answer: "Binnen 1–2 werkdagen.",
    },
    {
      question: "Moet ik het product eerst terugsturen?",
      answer: "Alleen als wij dit aangeven. Verstuur nooit iets zonder bevestiging.",
    },
    {
      question: "Krijg ik een nieuw product of reparatie?",
      answer: "Afhankelijk van het defect — het verschilt per leverancier. De opties zijn simpelweg niets, reparatie, vervanging of geld retour.",
    },
    {
      question: "Is schade door eigen montage gedekt?",
      answer: "Nee, maar we helpen wel mee om het juiste onderdeel of oplossing te vinden.",
    },
  ];

  return (
    <div className="bg-[#F7F7F7] min-h-screen py-12 px-4 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1C2530] mb-4">Garantie Aanvraag</h1>
          <p className="text-[#3D4752] text-lg">
            Heb je een probleem met je bestelling? Vul hieronder je aanvraag in — we helpen je snel verder.
          </p>
        </div>

        {/* Conditions Section */}
        <div className="bg-white rounded-lg p-6 lg:p-8 shadow-sm border border-[#E7ECF3] mb-8">
          <h2 className="text-xl font-semibold text-[#1C2530] mb-4">Wanneer kun je garantie aanvragen?</h2>
          <ul className="space-y-2 text-[#3D4752] list-disc list-inside">
            <li>Een product functioneert niet zoals het hoort</li>
            <li>Een onderdeel is defect of werkt niet meer</li>
            <li>Beschadiging direct na ontvangst</li>
            <li>Product heeft een productiefout</li>
            <li>Verkleuring of slijtage binnen garantietermijn (niet door verkeerd gebruik)</li>
          </ul>
        </div>

        {/* Form Section */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 lg:p-8 shadow-sm border border-[#E7ECF3] space-y-8">
            
            {/* Klantgegevens */}
            <div>
              <h3 className="text-lg font-semibold text-[#1C2530] mb-4 flex items-center gap-2">
                <span className="text-[#0066FF]">🔹</span> Klantgegevens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#3D4752]">Naam <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="input input-bordered w-full bg-white border-[#D0DFEE] focus:border-[#0066FF] focus:ring-0 rounded-sm"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#3D4752]">E-mail <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="input input-bordered w-full bg-white border-[#D0DFEE] focus:border-[#0066FF] focus:ring-0 rounded-sm"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-sm font-medium text-[#3D4752]">Telefoonnummer</label>
                  <input
                    type="tel"
                    name="phone"
                    className="input input-bordered w-full bg-white border-[#D0DFEE] focus:border-[#0066FF] focus:ring-0 rounded-sm"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Bestelinformatie */}
            <div>
              <h3 className="text-lg font-semibold text-[#1C2530] mb-4 flex items-center gap-2">
                <span className="text-[#0066FF]">🔹</span> Bestelinformatie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#3D4752]">Ordernummer <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="orderNumber"
                    required
                    className="input input-bordered w-full bg-white border-[#D0DFEE] focus:border-[#0066FF] focus:ring-0 rounded-sm"
                    value={formData.orderNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#3D4752]">Aankoopdatum <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="purchaseDate"
                    required
                    className="input input-bordered w-full bg-white border-[#D0DFEE] focus:border-[#0066FF] focus:ring-0 rounded-sm"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-sm font-medium text-[#3D4752]">Productnaam <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="productName"
                    required
                    className="input input-bordered w-full bg-white border-[#D0DFEE] focus:border-[#0066FF] focus:ring-0 rounded-sm"
                    value={formData.productName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Probleemomschrijving */}
            <div>
              <h3 className="text-lg font-semibold text-[#1C2530] mb-4 flex items-center gap-2">
                <span className="text-[#0066FF]">🔹</span> Probleemomschrijving
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#3D4752]">Beschrijf het probleem zo duidelijk mogelijk <span className="text-red-500">*</span></label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    className="textarea textarea-bordered w-full bg-white border-[#D0DFEE] focus:border-[#0066FF] focus:ring-0 rounded-sm text-base"
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#3D4752]">Foto upload (Duidelijke foto's van het defect) <span className="text-red-500">*</span></label>
                  <input
                    type="file"
                    multiple
                    required
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input file-input-bordered w-full bg-white border-[#D0DFEE] focus:border-[#0066FF] rounded-sm"
                  />
                  <span className="text-xs text-gray-500">Selecteer meerdere bestanden indien nodig.</span>
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <div className="flex items-start gap-3 p-4 bg-[#F3F8FF] rounded-sm border border-[#E7ECF3]">
              <input
                type="checkbox"
                required
                checked={formData.confirmed}
                onChange={handleCheckboxChange}
                className="checkbox checkbox-primary mt-1 w-5 h-5 rounded-sm border-gray-400"
              />
              <span className="text-sm text-[#3D4752]">
                Ik bevestig dat de informatie correct is en dat het defect niet is ontstaan door verkeerd gebruik.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn bg-[#0066FF] hover:bg-[#0052CC] text-white w-full text-lg font-medium rounded-sm border-none shadow-sm"
            >
              Garantie Aanvraag Versturen
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Aanvraag Ontvangen!</h2>
            <p className="text-green-700 text-lg mb-6">
              Je aanvraag is ontvangen. Wij beoordelen deze binnen 1–2 werkdagen.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-[#0066FF] font-medium hover:underline"
            >
              Nog een aanvraag doen
            </button>
          </motion.div>
        )}

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#1C2530] mb-6 text-center">Veelgestelde vragen</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-[#E7ECF3]">
                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer px-6 py-4 font-semibold text-lg text-[#1C2530]">
                    {faq.question}
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-[#0066FF] group-open:rotate-180 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-4 text-[#3D4752]">
                    {faq.answer}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
