import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { getShippingSettings, getShippingRules } from "@/lib/woocommerce";
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

        <Script id="gtm-init" strategy="lazyOnload">
          {`window.dataLayer = window.dataLayer || [];
window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});`}
        </Script>
        <Script
          id="gtm-script"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-NBGNBVR3"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
