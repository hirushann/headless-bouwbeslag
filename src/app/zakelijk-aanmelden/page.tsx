"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function B2BSignupPage() {
  const [formData, setFormData] = useState({
    company_name: "",
    coc_number: "",
    vat_number: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.company_name || !formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setError("Vul alle verplichte velden in.");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/register-b2b", formData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/account/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Er is iets misgegaan. Probeer het later opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="max-w-[1440px] mx-auto p-8 font-sans min-h-[60vh] flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-lg w-full">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-3xl text-green-600 mb-4">Aanvraag Ontvangen!</h2>
            <p className="text-gray-600">Bedankt voor je aanmelding. Je zakelijke account is aangemaakt. Je wordt nu doorgestuurd naar de inlogpagina.</p>
            <div className="mt-6">
              <Link href="/account/login" className="btn btn-primary">Direct inloggen</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1440px] mx-auto p-8 font-sans">
      <div className="hero w-full">
        <div className="hero-content flex-col w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1C2530] mb-4">Zakelijk Account Aanmaken</h1>
            <p className="text-[#3D4752]">Meld je aan voor een zakelijk account en profiteer van scherpe inkoopprijzen.</p>
          </div>
          
          <div className="card bg-base-100 w-full shrink-0 shadow-sm border border-gray-100">
            <form className="card-body w-full" onSubmit={handleSubmit}>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Bedrijfsgegevens</h3>
                  
                  <fieldset className="fieldset w-full">
                    <label className="label font-medium">Bedrijfsnaam *</label>
                    <input type="text" name="company_name" className="input w-full focus:!outline-0 focus:!ring-0 bg-gray-50" placeholder="Bijv. Bouwbedrijf Jansen" value={formData.company_name} onChange={handleChange} required />
                  </fieldset>

                  <fieldset className="fieldset w-full">
                    <label className="label font-medium">KvK Nummer</label>
                    <input type="text" name="coc_number" className="input w-full focus:!outline-0 focus:!ring-0 bg-gray-50" placeholder="8 cijfers" value={formData.coc_number} onChange={handleChange} />
                  </fieldset>

                  <fieldset className="fieldset w-full">
                    <label className="label font-medium">BTW Nummer</label>
                    <input type="text" name="vat_number" className="input w-full focus:!outline-0 focus:!ring-0 bg-gray-50" placeholder="NL..." value={formData.vat_number} onChange={handleChange} />
                  </fieldset>
                </div>

                {/* Personal Details */}
                <div className="space-y-4">
                   <h3 className="font-semibold text-lg border-b pb-2">Persoonlijke gegevens</h3>
                  
                   <div className="flex gap-4">
                      <fieldset className="fieldset w-full">
                        <label className="label font-medium">Voornaam *</label>
                        <input type="text" name="first_name" className="input w-full focus:!outline-0 focus:!ring-0 bg-gray-50" placeholder="Voornaam" value={formData.first_name} onChange={handleChange} required />
                      </fieldset>
                      
                      <fieldset className="fieldset w-full">
                        <label className="label font-medium">Achternaam *</label>
                        <input type="text" name="last_name" className="input w-full focus:!outline-0 focus:!ring-0 bg-gray-50" placeholder="Achternaam" value={formData.last_name} onChange={handleChange} required />
                      </fieldset>
                   </div>

                  <fieldset className="fieldset w-full">
                    <label className="label font-medium">Email Adres *</label>
                    <input type="email" name="email" className="input w-full focus:!outline-0 focus:!ring-0 bg-gray-50" placeholder="naam@bedrijf.nl" value={formData.email} onChange={handleChange} required />
                  </fieldset>

                  <fieldset className="fieldset w-full">
                    <label className="label font-medium">Wachtwoord *</label>
                    <input type="password" name="password" className="input w-full focus:!outline-0 focus:!ring-0 bg-gray-50" placeholder="Minimaal 6 karakters" value={formData.password} onChange={handleChange} required minLength={6} />
                  </fieldset>
                </div>
              </div>

              {error && (
                <div role="alert" className="alert alert-error mt-6 bg-red-50 text-red-700 border-red-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-control mt-8">
                <button className="btn btn-primary w-full lg:w-auto lg:self-end px-10 text-white font-bold" disabled={loading}>
                  {loading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Account Aanmaken"
                  )}
                </button>
              </div>

            </form>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-500">
             Heb je al een account? <Link href="/account/login" className="link link-primary font-semibold">Log hier in</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
