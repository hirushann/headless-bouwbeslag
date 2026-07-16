import { Metadata } from 'next';
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: 'Inloggen | Bouwbeslag',
  description: 'Log in op je Bouwbeslag account om je bestellingen te volgen en sneller af te rekenen.',
  alternates: {
    canonical: '/account/login',
  },
};

type LoginPageProps = {
  searchParams: Promise<{ reset?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const reset = Array.isArray(params.reset) ? params.reset[0] : params.reset;

  return <LoginClient resetComplete={reset === "success"} />;
}
