import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout/Success | Bouwbeslag',
  alternates: { canonical: "/checkout/success" },
  robots: "noindex, nofollow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
