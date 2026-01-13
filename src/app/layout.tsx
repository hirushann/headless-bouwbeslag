import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";
import { getShippingSettings } from "@/lib/woocommerce";
import { UserProvider } from "@/context/UserContext"; // Import UserProvider

const dmsans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bouwbeslag & Deurbeslag van A-Merken | Laagste Prijs Garantie",
  description: "Ontdek hoogwaardig bouw- en deurbeslag van topmerken. Groot assortiment, scherpe prijzen, snelle levering en deskundig advies. Bouwbeslag.nl – altijd A-kwaliteit.",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shippingSettings = await getShippingSettings();

  return (
    <html lang="en" data-theme="light">
      <body className={`${dmsans.variable} ${geistMono.variable} font-sans antialiased`} >
        <Toaster position="top-right" />
        <UserProvider>
          <Header shippingMethods={shippingSettings} />
          {children}
        </UserProvider>

        <footer className="font-sans">
          <div className="lg:w-full bg-[#0066FF] overflow-scroll lg:overflow-hidden px-5 lg:px-0">
            <div className="lg:max-w-[1440px] lg:mx-auto lg:relative py-3 flex flex-nowrap justify-between items-center w-4xl lg:w-full">
              <div className="flex items-center gap-2 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#ffffff"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                <span className="text-[#FFFFFF] font-medium text-base">Gegarandeerd de goedkoopste</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#ffffff"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                <span className="text-[#FFFFFF] font-medium text-base">Alleen kwaliteitsmerken</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#ffffff"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                <span className="text-[#FFFFFF] font-medium text-base">Wij doen wat we zeggen</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#ffffff"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                <span className="text-[#FFFFFF] font-medium text-base">30 dagen retourrecht</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#1C2630] py-8">
            <div className="max-w-[1440px] mx-auto relative lg:py-3 flex flex-col lg:flex-row w-full justify-between px-5 lg:px-0">
              <div className="flex flex-col gap-3">
                <div>
                  <Image className="-ml-2" src="/footerlogo.png" alt="Footer Logo" width={300} height={300} />
                  <p className="text-[#C4C4C4] font-normal text-base mt-1">Bouwbeslag.nl is onderdeel van DayZ Solutions</p>
                </div>

                <div className="rounded-lg bg-[#FFFFFF0D] w-max px-3.5 py-2 flex items-center justify-center mt-2 lg:mt-5">
                  <Image src="/footer-review.png" alt="Footer Logo" width={200} height={200} />
                </div>

                <div className="flex flex-col gap-3 my-5">
                  <p className="font-bold text-xl text-white">Blijf op de hoogte via de socials:</p>
                  <div className="flex gap-4 items-center">
                    <a href="" className="rounded-full p-2 bg-[#0066FF] text-white border border-[#0066FF] hover:bg-white hover:border hover:border-[#0066FF] hover:text-[#0066FF] flex w-max cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor" className="transition-colors"><path d="M240 363.3L240 576L356 576L356 363.3L442.5 363.3L460.5 265.5L356 265.5L356 230.9C356 179.2 376.3 159.4 428.7 159.4C445 159.4 458.1 159.8 465.7 160.6L465.7 71.9C451.4 68 416.4 64 396.2 64C289.3 64 240 114.5 240 223.4L240 265.5L174 265.5L174 363.3L240 363.3z"/></svg>
                    </a>
                    <a href="" className="rounded-full p-2 bg-[#0066FF] text-white border border-[#0066FF] hover:bg-white hover:border hover:border-[#0066FF] hover:text-[#0066FF] flex w-max cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="currentColor" className="transition-colors"><path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z"/></svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start lg:justify-evenly w-full gap-8 lg:gap-0 lg:w-[50%]">
                {/* <div>
                  <p className="text-white font-bold text-xl mb-5">Categories</p>
                  <ul className="text-[#C4C4C4] text-base font-normal flex flex-col gap-3">
                    <li>Window hardware</li>
                    <li>Interior door fittings</li>
                    <li>Exterior door fittings</li>
                    <li>Sliding door hardware</li>
                    <li>Assortment</li>
                    <li>More</li>
                  </ul>
                </div> */}
                <div>
                  <p className="text-white font-bold text-xl mb-5">Handige links</p>
                  <ul className="text-[#C4C4C4] text-base font-normal flex flex-col gap-3">
                    <li>
                      <Link href="/algemene-voorwaarden">Algemene Voorwaarden</Link>
                    </li>
                    <li>
                      <Link href="/retourbeleid">Retourbeleid</Link>
                    </li>
                    <li>
                      <Link href="/privacy-policy">Privacybeleid</Link>
                    </li>
                    <li>
                      <Link href="/kennisbank">Blogs</Link>
                    </li>
                    {/* <li>Help & Support</li> */}
                    <li>
                      <Link href="/contact">Contact</Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 lg:mt-0">
                <p className="text-white font-bold text-xl mb-5">Contactgegevens</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Image src="/emailicon.png" alt="Footer Logo" width={50} height={50} />
                    <div>
                      <p className="text-[#C4C4C4] font-semibold text-[13px] uppercase">E-mail</p>
                      <a href="mailto:contact@bouwbeslag.nl" target="_blank" className="text-white font-medium text-base">contact@bouwbeslag.nl</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image src="/kvkicon.png" alt="Footer Logo" width={50} height={50} />
                    <div>
                      <p className="text-[#C4C4C4] font-semibold text-[13px] uppercase">KVK</p>
                      <p className="text-white font-medium text-base">77245350</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image src="/btwicon.png" alt="Footer Logo" width={50} height={50} />
                    <div>
                      <p className="text-[#C4C4C4] font-semibold text-[13px] uppercase">btw</p>
                      <p className="text-white font-medium text-base">NL003174000B88</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#151E26]">
            <div className="max-w-[1440px] mx-auto relative py-4 flex flex-col lg:flex-row gap-5 lg:gap-0 justify-between items-center">
              <div>
                <p className="text-[#C4C4C4] font-normal text-base">Copyright @ 2025 Bouwbeslag. All rights reserved.</p>
              </div>
              <div className="flex gap-2 justify-center items-center">
                <p className="text-white font-semibold text-sm uppercase">WIJ ACCEPTEREN:</p>
                <Image src="/footerpayment.png" alt="footer payment" width={200} height={200} />
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
