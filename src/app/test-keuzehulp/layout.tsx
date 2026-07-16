import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Keuzehulp | Bouwbeslag',
  alternates: { canonical: "/test-keuzehulp" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
