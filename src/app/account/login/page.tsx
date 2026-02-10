import { Metadata } from 'next';
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: 'Inloggen | Bouwbeslag',
  description: 'Log in op je Bouwbeslag account om je bestellingen te volgen en sneller af te rekenen.',
  alternates: {
    canonical: '/account/login',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
