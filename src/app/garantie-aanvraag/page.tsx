import { Metadata } from 'next';
import WarrantyClient from "./WarrantyClient";

export const metadata: Metadata = {
  alternates: { canonical: "/garantie-aanvraag" },
  title: 'Garantie Aanvraag | Bouwbeslag',
  description: 'Dien eenvoudig een garantieaanvraag in voor uw producten bij Bouwbeslag.',
};

export default function WarrantyRequestPage() {
  return <WarrantyClient />;
}
