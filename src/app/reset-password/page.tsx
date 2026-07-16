import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
    email?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const metadata: Metadata = {
  title: "Wachtwoord opnieuw instellen | Bouwbeslag",
  description: "Kies een nieuw wachtwoord voor je Bouwbeslag-account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <ResetPasswordClient
      initialEmail={firstParam(params.email)}
      initialToken={firstParam(params.token)}
    />
  );
}
