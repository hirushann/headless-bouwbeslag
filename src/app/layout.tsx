import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { getShippingSettings } from "@/lib/woocommerce";
import { UserProvider } from "@/context/UserContext";
import { Suspense } from "react";

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

async function HeaderWrapper() {
  const shippingSettings = await getShippingSettings();
  return <Header shippingMethods={shippingSettings} />;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://bouwbeslag.nl" />
        <link rel="dns-prefetch" href="https://bouwbeslag.nl" />
      </head>
      <body className={`${dmsans.variable} ${geistMono.variable} font-sans antialiased`} >
        <Toaster position="top-right" />
        <UserProvider>
          <Suspense fallback={<div className="h-20 w-full bg-white border-b border-gray-100" />}>
            <HeaderWrapper />
          </Suspense>
          {children}
        </UserProvider>

        <Footer />
      </body>
    </html>
  );
}
