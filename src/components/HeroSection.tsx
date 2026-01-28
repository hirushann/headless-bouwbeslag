"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
     className="w-full lg:w-[74%] lg:h-[80vh] bg-[linear-gradient(270deg,#1422AC_0%,#00074B_100.82%)] lg:rounded-sm overflow-hidden relative flex flex-col-reverse lg:flex-row items-center gap-12 py-12 lg:gap-0 lg:py-0">
      <div className="lg:w-1/2 px-5 lg:px-0 lg:pl-12 flex flex-col gap-3">
        <h1 className="text-white font-bold text-[32px] lg:text-6xl leading-[120%]">
          Uitstekend gedetailleerd ontwerp!
        </h1>
        <p className="font-normal text-sm lg:text-xl text-white leading-[32px]">
          Conceptcollecties voor deur-, raam- en meubelbeslag.
        </p>
        <button className="flex gap-2 items-center bg-[#0066FF] rounded-sm py-2.5 lg:py-4.5 px-7 w-full justify-center lg:w-max uppercase">
          <span className="font-bold text-sm text-white leading-[22px]">
            Toevoegen aan winkelwagen
          </span>
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              width="20"
              height="20"
              fill="#ffffff"
            >
              <path d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z" />
            </svg>
          </span>
        </button>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center">
        <Image
          className="lg:w-full lg:h-full lg:object-contain lg:object-right rotate-340"
          src="/herobg.webp"
          alt="Hero"
          width={600}
          height={400}
          priority
          loading="eager"
          decoding="async" 
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </motion.div>
  );
}
