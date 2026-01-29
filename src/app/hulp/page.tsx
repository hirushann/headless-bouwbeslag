import FadeIn from "@/components/animations/FadeIn";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hulp & Ondersteuning | Bouwbeslag",
  description: "Heeft u vragen of hulp nodig? Bekijk onze contactmogelijkheden en veelgestelde vragen.",
};

export default function HelpPage() {
  return (
    <main className="bg-[#F5F5F5] min-h-screen pt-10 px-5 lg:px-0 font-sans text-[#1C2530]">
      <div className="max-w-[1440px] mx-auto">
        <FadeIn>
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
            <Link href="/" className="hover:underline flex items-center gap-1 text-black">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>Home</span>
            </Link>{" "}
            / Hulp
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-[#1C2530]">Hulp & Ondersteuning</h1>
          <p className="text-[#3D4752] text-lg max-w-2xl mb-12">
            Heeft u een vraag over uw bestelling, een product of iets anders? We helpen u graag verder.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          <FadeIn delay={0.2} className="bg-white p-8 rounded-sm shadow-sm flex flex-col items-start gap-4 h-full">
            <div className="bg-[#E6F0FF] p-3 rounded-full text-[#0066FF]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">E-mail ons</h3>
              <p className="text-[#3D4752] mb-4">Stuur ons een bericht en we reageren zo snel mogelijk, meestal binnen 24 uur op werkdagen.</p>
              <a href="mailto:contact@bouwbeslag.nl" className="text-[#0066FF] font-semibold hover:underline">contact@bouwbeslag.nl</a>
            </div>
          </FadeIn>

          <FadeIn delay={0.3} className="bg-white p-8 rounded-sm shadow-sm flex flex-col items-start gap-4 h-full">
            <div className="bg-[#E6F0FF] p-3 rounded-full text-[#0066FF]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Bel ons</h3>
              <p className="text-[#3D4752] mb-4">Spreek direct met een van onze experts. Bereikbaar op werkdagen van 09:00 tot 17:00.</p>
              <a href="tel:0031578760508" className="text-[#0066FF] font-semibold hover:underline">0578-760508</a>
            </div>
          </FadeIn>

           <FadeIn delay={0.4} className="bg-white p-8 rounded-sm shadow-sm flex flex-col items-start gap-4 h-full">
            <div className="bg-[#E6F0FF] p-3 rounded-full text-[#0066FF]">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Veelgestelde vragen</h3>
              <p className="text-[#3D4752] mb-4">Vind snel antwoord op de meest gestelde vragen over verzending, retourneren en garantie.</p>
              {/* <Link href="/faq" className="text-[#0066FF] font-semibold hover:underline">Bekijk FAQ</Link> */}
            </div>
          </FadeIn>
        </div>
      </div>
    </main>
  );
}
