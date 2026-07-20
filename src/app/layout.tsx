import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { getShippingSettings, getShippingRules } from "@/lib/woocommerce";
import { UserProvider } from "@/context/UserContext";
import { ProductAddedModalProvider } from "@/context/ProductAddedModalContext";
import ProductAddedModalWrapper from "@/components/ProductAddedModalWrapper";

const dmsans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

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

import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="nl" data-theme="light">
      <head>
      </head>
      <body className={`${dmsans.variable} ${geistMono.variable} font-sans antialiased overflow-visible`} >
        <GoogleTagManager gtmId="GTM-NBGNBVR3" />
        <GoogleAnalytics gaId="G-F21GZC6NGG" />

        <Toaster position="top-right" />
        <UserProvider>
          <ProductAddedModalProvider>
            <Header />
            {children}
            <ProductAddedModalWrapper />
          </ProductAddedModalProvider>
        </UserProvider>

        <Footer />
      </body>
    </html>
  );
}
