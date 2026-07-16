import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Bouwbeslag',
  alternates: { canonical: "/checkout" },
  robots: "noindex, nofollow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
