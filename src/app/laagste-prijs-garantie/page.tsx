import React from 'react';
import GuaranteePageClient from './GuaranteePageClient';

export default async function GuaranteePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const initialProductLink = typeof resolvedSearchParams.product === 'string' ? resolvedSearchParams.product : '';

  return <GuaranteePageClient initialProductLink={initialProductLink} />;
}
