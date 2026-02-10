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
  return <AccountClient />;
}
