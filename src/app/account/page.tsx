import { Metadata } from 'next';
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: 'Mijn Account | Bouwbeslag',
  description: 'Beheer je account, bekijk bestellingen en update je gegevens bij Bouwbeslag.nl.',
  alternates: {
    canonical: '/account',
  },
};

export default function AccountPage() {
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "ProfilePage",
    "name": "Mijn Account | Bouwbeslag",
    "description": "Beheer je account, bekijk bestellingen en update je gegevens bij Bouwbeslag.nl.",
    "url": "https://bouwbeslag.nl/account",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <AccountClient />
    </>
  );
}
