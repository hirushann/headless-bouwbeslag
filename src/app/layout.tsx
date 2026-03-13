import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { getShippingSettings } from "@/lib/woocommerce";
import { UserProvider } from "@/context/UserContext";
import { Suspense } from "react";
import { ProductAddedModalProvider } from "@/context/ProductAddedModalContext";
import ProductAddedModal from "@/components/ProductAddedModal";

const dmsans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shippingSettings = await getShippingSettings();

  return (
    <html lang="nl" data-theme="light">
      <body className={`${dmsans.variable} ${geistMono.variable} font-sans antialiased overflow-visible`} >
        <Toaster position="top-right" />
        <UserProvider>
          <ProductAddedModalProvider>
            <Header shippingMethods={shippingSettings} />
            {children}
            <ProductAddedModal />
          </ProductAddedModalProvider>
        </UserProvider>

        <Footer />
      </body>
    </html>
  );
}
