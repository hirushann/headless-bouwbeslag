import { Metadata } from 'next';
import Link from 'next/link';
import FadeIn from '@/components/animations/FadeIn';

export const metadata: Metadata = {
  title: 'Bouwbeslag groothandel online | Topmerken, laagste prijs B2B',
  description: 'Online bouwbeslag groothandel voor de vakman. Topmerken, live voorraad, betalen op rekening en een laagste prijs garantie B2B. Bestel via webshop, mail of telefoon.',
};

export default function GroothandelPage() {
  return (
    <main className="flex flex-col items-center font-sans bg-[#F5F5F5] min-h-screen">
      <div className="w-full bg-white border-b border-[#DBE3EA]">
        <div className="max-w-[1440px] mx-auto px-5 py-16 lg:py-20 text-center lg:text-left">
          <FadeIn delay={0.1}>
            <h1 className="text-3xl lg:text-5xl font-bold text-[#1C2530] mb-5 leading-tight">
              Bouwbeslag groothandel voor mensen die het beslag écht in handen hebben
            </h1>
            <p className="text-[#3D4752] text-lg lg:text-xl mb-8 leading-relaxed">
              Wij zijn een online bouwbeslag groothandel. Geen tussenpersonen, geen verrassingen achteraf &mdash; gewoon goed beslag van merken die je kent, tegen de laagste prijs, geleverd wanneer je het nodig hebt.
            </p>
            <Link href="/zakelijk-aanmelden" className="bg-[#0066FF] text-white px-8 py-3.5 rounded-sm font-semibold inline-block hover:bg-blue-700 transition-colors">
              Word klant
            </Link>
          </FadeIn>
        </div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-5 py-10 lg:py-16">
        <FadeIn delay={0.2}>
          <section className="py-8 border-b border-[#DBE3EA]">
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              Even eerlijk: bouwbeslag inkopen hoort niet de helft van je dag te kosten. Je wil weten wat er op voorraad ligt, wat het kost en wanneer het op de bouw staat. Meer niet. Daar hebben wij onze hele winkel omheen gebouwd.
            </p>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              Of je nu een paar scharnieren nodig hebt of een complete partij deurkrukken voor een project &mdash; je bestelt bij ons zoals het jou uitkomt. Via de webshop als je zelf even wil rondklikken, of gewoon met een belletje of mailtje als je liever een inkooporder in je eigen systeem wegschrijft.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.3}>
          <section className="py-8 border-b border-[#DBE3EA]">
            <h2 className="text-2xl lg:text-3xl font-semibold text-[#1C2530] mt-4 mb-4">
              De merken die je verwacht van een serieuze groothandel
            </h2>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              We werken alleen met beslag waar we zelf achter staan. Dat scheelt jou gedoe op de bouw en ons gezeur achteraf.
            </p>
            <div className="bg-white border border-[#DBE3EA] rounded-sm p-6 my-6 shadow-[0px_10px_15px_0px_#0000000A] text-lg text-[#3D4752] leading-relaxed">
              <strong className="text-[#0066FF] font-semibold">Artitec Wallenbroek</strong> &middot; <strong className="text-[#0066FF] font-semibold">Mi Satori</strong> &middot; <strong className="text-[#0066FF] font-semibold">JNF</strong> &middot; <strong className="text-[#0066FF] font-semibold">Giesse</strong> &middot; <strong className="text-[#0066FF] font-semibold">Winlock</strong> &middot; <strong className="text-[#0066FF] font-semibold">Frank Allart</strong> &middot; <strong className="text-[#0066FF] font-semibold">HABO</strong> &middot; <strong className="text-[#0066FF] font-semibold">HAKO</strong> &middot; <strong className="text-[#0066FF] font-semibold">GPF Bouwbeslag</strong> &middot; <strong className="text-[#0066FF] font-semibold">SWF (Steel Window Fittings)</strong> &middot; <strong className="text-[#0066FF] font-semibold">Zoo Hardware</strong> &middot; <strong className="text-[#0066FF] font-semibold">Q-Lon</strong> &middot; <strong className="text-[#0066FF] font-semibold">Schlegel borstel</strong>
            </div>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              Van krukken en scharnieren tot tochtprofielen en raambeslag &mdash; het hoort er allemaal bij, en het ligt klaar.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.4}>
          <section className="py-8 border-b border-[#DBE3EA]">
            <h2 className="text-2xl lg:text-3xl font-semibold text-[#1C2530] mt-4 mb-4">
              Laagste prijs garantie, en dat menen we
            </h2>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              Voor onze zakelijke klanten hanteren we een volledige laagste prijs garantie. Vind je hetzelfde artikel ergens goedkoper? Dan zorgen wij dat je bij ons niet meer betaalt. Geen kleine lettertjes waar je een uur op moet studeren &mdash; je weet gewoon zeker dat je het scherp inkoopt.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.5}>
          <section className="py-8 border-b border-[#DBE3EA]">
            <h2 className="text-2xl lg:text-3xl font-semibold text-[#1C2530] mt-4 mb-4">
              Voorraad die je vooraf ziet, geen gokwerk
            </h2>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              Niets zo vervelend als bestellen en daarna horen dat iets &lsquo;eraan komt&rsquo;. Bij ons zie je de actuele voorraadaantallen voordat je bestelt. Zo weet je op voorhand wat er ligt en plan je je werk zonder verrassingen. En staat iets een keer niet op voorraad? Dan krijg je vooraf een duidelijke levertijd te zien, niet pas als het misgaat.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.6}>
          <section className="py-8 border-b border-[#DBE3EA]">
            <h2 className="text-2xl lg:text-3xl font-semibold text-[#1C2530] mt-4 mb-4">
              Bestellen en betalen zoals het jou past
            </h2>
            <h3 className="text-xl font-semibold text-[#1C2530] mt-6 mb-3">Drie manieren om te bestellen</h3>
            <ul className="list-disc pl-5 mb-6 space-y-2 text-[#3D4752] text-base">
              <li><strong className="font-semibold text-[#1C2530]">Via de webshop</strong> &mdash; snel zelf samenstellen, dag en nacht.</li>
              <li><strong className="font-semibold text-[#1C2530]">Telefonisch</strong> &mdash; even een vraag of liever persoonlijk doorgeven? Bel ons.</li>
              <li><strong className="font-semibold text-[#1C2530]">Per e-mail</strong> &mdash; handig als je de bestelling als inkooporder in je eigen systeem wil verwerken.</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#1C2530] mt-6 mb-3">Betalen op rekening</h3>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              Als zakelijke klant betaal je gewoon op rekening: 30 dagen netto. Geen creditcardgedoe bij elke bestelling, gewoon afrekenen wanneer het in jouw administratie uitkomt.
            </p>
            <div className="bg-white border-l-4 border-[#0066FF] p-5 rounded-r-sm my-6 shadow-sm text-[#3D4752] text-base leading-relaxed">
              <strong className="font-semibold text-[#1C2530]">Verzendkosten zonder verrassingen:</strong> B2B-orders tot &euro;250,&ndash; rekenen we &euro;7,50 verzendkosten. Daarboven leveren we franco huis &mdash; met uitzondering van lengtevracht.
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={0.7}>
          <section className="py-8" id="aanmelden">
            <h2 className="text-2xl lg:text-3xl font-semibold text-[#1C2530] mt-4 mb-4">
              Klant worden &mdash; voor wie is dit?
            </h2>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              We werken zakelijk, voor de mensen die met bouwbeslag werken. Je kunt je aanmelden als klant zodra je minimaal tweemaal per maand deurbeslag of bouwbeslag nodig hebt.
            </p>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              Denk aan timmermannen, aannemers, schilders en architecten &mdash; iedereen die regelmatig beslag inkoopt en gewoon een vaste, betrouwbare leverancier wil zonder poespas.
            </p>
            <p className="text-[#3D4752] text-base mb-4 leading-relaxed">
              Herken je jezelf hierin? Meld je aan, dan zetten we je account klaar en kun je meteen aan de slag.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.8}>
          <div className="bg-[#1C2530] text-white rounded-lg p-10 my-12 text-center shadow-lg">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mt-0 mb-4">
              Klaar om scherper in te kopen?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-[600px] mx-auto">
              Word vandaag nog klant en bestel met live voorraad, betaling op rekening en de laagste prijs garantie.
            </p>
            <Link href="/zakelijk-aanmelden" className="bg-[#0066FF] text-white px-8 py-3.5 rounded-sm font-semibold inline-block hover:bg-blue-700 transition-colors">
              Meld je aan als klant
            </Link>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
