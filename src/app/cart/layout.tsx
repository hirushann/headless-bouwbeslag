import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cart | Bouwbeslag',
  alternates: { canonical: "/cart" },
  robots: "noindex, nofollow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
