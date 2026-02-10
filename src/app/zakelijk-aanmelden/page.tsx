
import { Metadata } from "next";
import B2BSignupForm from "@/components/B2BSignupForm";

export const metadata: Metadata = {
  title: "Zakelijk Account Aanmaken | Bouwbeslag.nl",
  description: "Meld je aan voor een zakelijk account bij Bouwbeslag.nl en profiteer van scherpe inkoopprijzen en snelle levering.",
  alternates: {
    canonical: '/zakelijk-aanmelden',
  },
  openGraph: {
    title: "Zakelijk Account Aanmaken | Bouwbeslag.nl",
    description: "Meld je aan voor een zakelijk account bij Bouwbeslag.nl en profiteer van scherpe inkoopprijzen en snelle levering.",
    type: "website",
    url: "/zakelijk-aanmelden",
  }
};

export default function B2BSignupPage() {
  return <B2BSignupForm />;
}
