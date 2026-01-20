import React from 'react';
import GuaranteePageClient from './GuaranteePageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laagste Prijs Garantie | Bouwbeslag',
  description: 'Profiteer van onze laagste prijsgarantie. Ziet u het ergens anders goedkoper? Wij passen de prijs aan.',
};

export default async function GuaranteePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const initialProductLink = typeof resolvedSearchParams.product === 'string' ? resolvedSearchParams.product : '';

  return <GuaranteePageClient initialProductLink={initialProductLink} />;
}
