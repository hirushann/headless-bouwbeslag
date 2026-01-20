import { Metadata } from 'next';
import WarrantyClient from "./WarrantyClient";

export const metadata: Metadata = {
  title: 'Garantie Aanvraag | Bouwbeslag',
  description: 'Dien eenvoudig een garantieaanvraag in voor uw producten bij Bouwbeslag.',
};

export default function WarrantyRequestPage() {
  return <WarrantyClient />;
}
