"use client";

import Image from "next/image";
import Link from "next/link";
import WebwinkelKeurWidget from "./WebwinkelKeurWidget";

export default function Footer() {
  return (
    <footer className="font-sans">
      <div className="lg:w-full bg-[#0066FF] overflow-scroll lg:overflow-hidden px-5 lg:px-0">
        <div className="lg:max-w-[1440px] lg:mx-auto lg:relative py-3 flex flex-nowrap justify-between items-center w-4xl lg:w-full">
          {[
            "Gegarandeerd de goedkoopste",
            "Alleen kwaliteitsmerken",
            "Wij doen wat we zeggen",
            "30 dagen retourrecht",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2 justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#ffffff">
                <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" />
              </svg>
              <span className="text-[#FFFFFF] font-medium text-base">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-[#1C2630] py-8">
        <div className="max-w-[1440px] mx-auto relative lg:py-3 flex flex-col lg:flex-row w-full justify-between px-5 lg:px-0">
          <div className="flex flex-col gap-3">
            <div>
            <div className="w-[180px] h-[40px] relative -ml-2 mb-2">
              <Image 
                src="/footerlogo.webp" 
                alt="Footer Logo" 
                fill 
                className="object-contain" 
                sizes="180px"
              />
            </div>
              <p className="text-[#C4C4C4] font-normal text-base mt-1">Bouwbeslag.nl is onderdeel van DayZ Solutions</p>
            </div>
            <div className="rounded-lg bg-[#FFFFFF0D] w-max px-3.5 py-2 flex items-center justify-center mt-2 lg:mt-5">
              <WebwinkelKeurWidget variant="footer" />
            </div>
            <div className="flex flex-col gap-3 my-5">
              <p className="font-bold text-xl text-white">Blijf op de hoogte via de socials:</p>
              <div className="flex gap-4 items-center">
                {/* Simplified social icons to save KiB */}
                <span className="p-2 bg-[#0066FF] text-white rounded-full">FB</span>
                <span className="p-2 bg-[#0066FF] text-white rounded-full">IG</span>
              </div>
            </div>
          </div>

          <div className="flex items-start lg:justify-evenly w-full gap-8 lg:gap-0 lg:w-[50%]">
            <div>
              <p className="text-white font-bold text-xl mb-5">Handige links</p>
              <ul className="text-[#C4C4C4] text-base font-normal flex flex-col gap-3">
                <li><Link href="/algemene-voorwaarden">Algemene Voorwaarden</Link></li>
                <li><Link href="/retourbeleid">Retourbeleid</Link></li>
                <li><Link href="/privacy-policy">Privacybeleid</Link></li>
                <li><Link href="/kennisbank">Blogs</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-5 lg:mt-0">
            <p className="text-white font-bold text-xl mb-5">Contactgegevens</p>
            <div className="flex flex-col gap-3">
              <p className="text-white font-medium text-base">contact@bouwbeslag.nl</p>
              <p className="text-white font-medium text-base">KVK: 77245350</p>
              <p className="text-white font-medium text-base">BTW: NL003174000B88</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#151E26]">
        <div className="max-w-[1440px] mx-auto relative py-4 flex flex-col lg:flex-row gap-5 lg:gap-0 justify-between items-center">
          <p className="text-[#C4C4C4] font-normal text-base">Copyright @ 2025 Bouwbeslag. All rights reserved.</p>
          <div className="flex gap-2 justify-center items-center">
            <p className="text-white font-semibold text-sm uppercase">WIJ ACCEPTEREN:</p>
            <Image src="/footerpayment.webp" alt="Betaalmethoden" width={180} height={30} className="object-contain" />
          </div>
        </div>
      </div>
    </footer>
  );
}
