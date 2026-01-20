import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacybeleid | Bouwbeslag',
  description: 'Lees hoe wij omgaan met uw privacy en persoonsgegevens bij Bouwbeslag.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-[1440px] mx-auto px-5 lg:px-0 py-10 lg:py-20">
      <h1 className="text-3xl lg:text-4xl font-bold mb-6 text-[#1C2630]">Privacybeleid</h1>
      
      <div className="prose max-w-none text-[#1C2630]">
        <p className="mb-4">
          Laatst bijgewerkt: 03 december 2025
        </p>

        <p className="mb-4">
          Dit privacybeleid beschrijft ons beleid en onze procedures met betrekking tot het verzamelen, gebruiken en openbaar maken van uw informatie wanneer u de service gebruikt en vertelt u over uw privacyrechten en hoe de wet u beschermt.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Interpretatie en definities</h2>
        
        <h3 className="text-xl font-semibold mt-6 mb-2">Interpretatie</h3>
        <p className="mb-4">
          De woorden waarvan de beginletter met een hoofdletter is geschreven, hebben een betekenis die is gedefinieerd onder de volgende voorwaarden. De volgende definities hebben dezelfde betekenis, ongeacht of ze in het enkelvoud of meervoud voorkomen.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-2">Definities</h3>
        <p className="mb-4">
          Voor de doeleinden van dit privacybeleid:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>Account</strong> betekent een uniek account dat voor u is aangemaakt om toegang te krijgen tot onze service of delen van onze service.</li>
          <li><strong>Bedrijf</strong> (in deze overeenkomst aangeduid als "het bedrijf", "wij", "ons" of "onze") verwijst naar Bouwbeslag.</li>
          <li><strong>Cookies</strong> zijn kleine bestanden die door een website op uw computer, mobiele apparaat of ander apparaat worden geplaatst en die onder andere de details van uw browsegeschiedenis op die website bevatten.</li>
          <li><strong>Apparaat</strong> betekent elk apparaat dat toegang heeft tot de service, zoals een computer, een mobiele telefoon of een digitale tablet.</li>
          <li><strong>Persoonsgegevens</strong> zijn alle gegevens die betrekking hebben op een geïdentificeerd of identificeerbaar individu.</li>
          <li><strong>Service</strong> verwijst naar de website.</li>
          <li><strong>Website</strong> verwijst naar Bouwbeslag, toegankelijk via bouwbeslag.nl</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Verzamelen en gebruiken van uw persoonlijke gegevens</h2>
        
        <h3 className="text-xl font-semibold mt-6 mb-2">Soorten verzamelde gegevens</h3>
        
        <h4 className="text-lg font-semibold mt-4 mb-2">Persoonsgegevens</h4>
        <p className="mb-4">
          Tijdens het gebruik van onze service kunnen we u vragen om ons bepaalde persoonlijk identificeerbare informatie te verstrekken die kan worden gebruikt om contact met u op te nemen of u te identificeren. Persoonlijk identificeerbare informatie kan omvatten, maar is niet beperkt tot:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>E-mailadres</li>
          <li>Voornaam en achternaam</li>
          <li>Telefoonnummer</li>
          <li>Adres, staat, provincie, postcode, stad</li>
          <li>Gebruiksgegevens</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Neem contact met ons op</h2>
        <p className="mb-4">
          Als u vragen heeft over dit privacybeleid, kunt u contact met ons opnemen:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Per e-mail: contact@bouwbeslag.nl</li>
        </ul>
      </div>
    </main>
  );
}
