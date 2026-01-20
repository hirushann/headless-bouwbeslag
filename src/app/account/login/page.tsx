"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import Link from "next/link";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inloggen | Bouwbeslag',
  description: 'Log in op je Bouwbeslag account om je bestellingen te volgen en sneller af te rekenen.',
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await login(username, password);
      
      // Check B2B Status
      const statusRes = await fetch("/api/auth/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: res.user_email })
      });
      const statusData = await statusRes.json();

      if (statusData.status === "denied") {
          // If pending
          if (statusData.reason === "pending") {
             setError("Uw account is nog in behandeling. U ontvangt een bericht zodra het is goedgekeurd.");
          } else {
             setError("Uw account is afgekeurd of geblokkeerd. Neem contact op met de klantenservice.");
          }
          setLoading(false);
          return;
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res));
      router.push("/account");
    } catch (err: any) {
      console.error("Login error details:", err.response?.data || err);
      // Try to get specific message from JWT response, fallback to generic
      const apiMessage = err.response?.data?.message;
      // Strip HTML tags if WP sends them (WP often sends <strong>ERROR</strong>...)
      const cleanMessage = apiMessage ? apiMessage.replace(/<[^>]*>/g, '') : "Ongeldige gebruikersnaam of wachtwoord";
      setError(cleanMessage);
    } finally {
      if (!error) setLoading(false); // Only unset loading if we didn't set it manually above
    }
  };

  return (
    <main className="bg-[#F5F5F5] min-h-[80vh] flex items-center justify-center py-10 px-4 font-sans">
      <div className="max-w-[1000px] w-full bg-white rounded-lg shadow-xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side - Image/Info */}
        <div className="lg:w-1/2 p-10 bg-[#0066FF] text-white flex flex-col justify-center">
             <h2 className="text-3xl lg:text-4xl font-bold mb-4">Welkom terug!</h2>
             <p className="text-blue-100 text-lg mb-8">
               Log in om je bestellingen te bekijken, je gegevens te beheren en sneller af te rekenen.
             </p>
             <div className="mt-auto">
               <p className="text-sm text-blue-200 uppercase tracking-wider font-semibold mb-2">Nog geen account?</p>
               <Link href="/zakelijk-aanmelden" className="inline-block bg-white text-[#0066FF] px-6 py-3 rounded-sm font-bold hover:bg-blue-50 transition-colors">
                 Zakelijk account aanvragen
               </Link>
             </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 p-10 lg:p-14">
            <h1 className="text-3xl font-bold text-[#1C2530] mb-2">Inloggen</h1>
            <p className="text-[#3D4752] mb-8">Vul je gegevens in om toegang te krijgen.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <fieldset className="fieldset w-full">
                <label className="text-[#1C2530] font-medium mb-1 block">Email adres of gebruikersnaam</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  </span>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all" 
                    placeholder="naam@voorbeeld.nl" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required
                  />
                </div>
              </fieldset>

              <fieldset className="fieldset w-full">
                <label className="text-[#1C2530] font-medium mb-1 block">Wachtwoord</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    )}
                  </span>
                </div>
                <div className="flex justify-end mt-2">
                   <a className="text-sm text-[#0066FF] hover:underline cursor-pointer">Wachtwoord vergeten?</a>
                </div>
              </fieldset>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-sm text-sm border border-red-200 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 shrink-0"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" /></svg>
                   {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-3.5 rounded-sm transition-colors flex justify-center items-center gap-2"
              >
                {loading ? (
                   <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                  <span>Inloggen</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  </>
                )}
              </button>
            </form>
        </div>
      </div>
    </main>
  );
}