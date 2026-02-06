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
                <Link target="_blank" href="https://wa.me/31578760508" className="p-2 bg-[#0066FF] text-white rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="size-5 fill-white"><path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z"/></svg>
                </Link>
                <span className="p-2 bg-[#0066FF] text-white rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="size-5 fill-white"><path d="M240 363.3L240 576L356 576L356 363.3L442.5 363.3L460.5 265.5L356 265.5L356 230.9C356 179.2 376.3 159.4 428.7 159.4C445 159.4 458.1 159.8 465.7 160.6L465.7 71.9C451.4 68 416.4 64 396.2 64C289.3 64 240 114.5 240 223.4L240 265.5L174 265.5L174 363.3L240 363.3z"/></svg>
                </span>
                <span className="p-2 bg-[#0066FF] text-white rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="size-5 fill-white"><path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z"/></svg>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start lg:justify-evenly w-full gap-8 lg:gap-0 lg:w-[50%]">
            <div>
              <p className="text-white font-bold text-xl mb-5">Handige links</p>
              <ul className="text-[#C4C4C4] text-base font-normal flex flex-col gap-3">
                <li><Link href="/algemene-voorwaarden">Algemene Voorwaarden</Link></li>
                <li><Link href="/retourbeleid">Retourbeleid</Link></li>
                <li><Link href="/klachtenregeling">Klachtenregeling</Link></li>
                <li><Link href="/privacy-policy">Privacybeleid</Link></li>
                <li><Link href="/kennisbank">Blogs</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-5 lg:mt-0">
            <p className="text-white font-bold text-xl mb-5">Contactgegevens</p>
            <div className="flex flex-col gap-3">
              <Link href="mailto:contact@bouwbeslag.nl" className="text-white font-medium text-base">contact@bouwbeslag.nl</Link>
              <Link href="tel:0031578760508" className="text-white font-medium text-base hover:underline">0578-760508</Link>
              <p className="text-white font-medium text-base">KVK: 77245350</p>
              <p className="text-white font-medium text-base">BTW: NL003174000B88</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#151E26]">
        <div className="max-w-[1440px] mx-auto relative py-4 flex flex-col lg:flex-row gap-5 lg:gap-0 justify-between items-center">
          <p className="text-[#C4C4C4] font-normal text-base">Copyright @ {new Date().getFullYear()} Bouwbeslag. All rights reserved.</p>
          <div className="flex gap-2 justify-center items-center">
            <p className="text-white font-semibold text-sm uppercase">WIJ ACCEPTEREN:</p>
            <Image src="/footerpayment.webp" alt="Betaalmethoden" width={180} height={30} className="object-contain" />
          </div>
        </div>
      </div>
    </footer>
  );
}
