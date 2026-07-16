import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search | Bouwbeslag',
  alternates: { canonical: "/search" },
  robots: "noindex, nofollow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
