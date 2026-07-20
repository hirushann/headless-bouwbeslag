import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/context/UserContext";
import { ProductAddedModalProvider } from "@/context/ProductAddedModalContext";
import ProductAddedModalWrapper from "@/components/ProductAddedModalWrapper";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl"),
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="nl" data-theme="light">
      <head>
        <link
          rel="preload"
          href="/fonts/dm-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased overflow-visible">
        <Toaster position="top-right" />
        <UserProvider>
          <ProductAddedModalProvider>
            <Header />
            {children}
            <ProductAddedModalWrapper />
          </ProductAddedModalProvider>
        </UserProvider>

        <Footer />

        <Script id="deferred-gtm" strategy="afterInteractive">
          {`(function(w,d,l,i){
  w[l]=w[l]||[];
  w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
  var loaded=false;
  var events=['pointerdown','keydown','touchstart','scroll'];
  function load(){
    if(loaded)return;
    loaded=true;
    clearTimeout(timer);
    events.forEach(function(event){w.removeEventListener(event,load);});
    var script=d.createElement('script');
    script.async=true;
    script.src='https://www.googletagmanager.com/gtm.js?id='+i;
    d.head.appendChild(script);
  }
  events.forEach(function(event){w.addEventListener(event,load,{once:true,passive:true});});
  var timer=setTimeout(load,6000);
})(window,document,'dataLayer','GTM-NBGNBVR3');`}
        </Script>
      </body>
    </html>
  );
}
