import Image from "next/image";
import Link from "next/link";
import api from "@/lib/woocommerce";
import { fetchPosts } from "@/lib/wordpress";
import dynamic from "next/dynamic";

// Client Components
import BestSellersCarousel from "@/components/carousels/BestSellers";
import RecommendedCarousel from "@/components/carousels/Recommended";
import CategoriesSidebar from "@/components/carousels/CategoriesSidebar";
import HeroSection from "@/components/HeroSection";
import FadeIn from "@/components/animations/FadeIn";

export const revalidate = 14400; //4 hours

import { Suspense } from "react";

// Async data components
async function BestSellersSection() {
  const products = await api.get("products", { per_page: 10 }).then((res: any) => res.data).catch(() => []);
  return <BestSellersCarousel products={products} />;
}

async function RecommendedSection() {
  const products = await api.get("products", { featured: true, per_page: 10 }).then((res: any) => res.data).catch(() => []);
  if (products.length === 0) return null;
  return <RecommendedCarousel products={products} />;
}

async function CategoriesSection() {
  const categories = await api.get("products/categories", { per_page: 100 }).then((res: any) => res.data).catch(() => []);
  return <CategoriesDisplay categories={categories} />;
}

async function BlogSection() {
  const posts = await fetchPosts(3).catch(() => []);
  if (!posts || posts.length === 0) return null;
  return (
    <FadeIn className="w-full py-10 px-5 lg:px-0" delay={0.1}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl lg:text-3xl font-bold text-[#1C2530]">Lees onze blog</h2>
        <div className="flex gap-2 items-center">
          <a href="/kennisbank" className="border border-[#0066FF] text-[#0066FF] uppercase rounded-sm px-4 py-2 font-semibold text-sm hover:text-white hover:bg-[#0066FF] cursor-pointer">Bekijk alles</a>
        </div>
      </div>
      <p className="text-[#3D4752] mb-8">Bekijk ons laatste artikel voor zinvolle inhoud of winkeltips</p>
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(Array.isArray(posts) ? posts : []).map((post: any) => (
            <div key={post.id}>
              <Link href={`/kennisbank/${post.slug}`}>
                <Image
                  className="mb-3 rounded-sm h-[250px] w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  src={post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "/default-fallback-image.webp"}
                  alt={post.title.rendered}
                  width={500}
                  height={200}
                />
              </Link>
              <div className="flex flex-col gap-2">
                <p className="text-[#0066FF] font-normal text-sm">{new Date(post.date).toISOString().split("T")[0]}</p>
                <Link href={`/kennisbank/${post.slug}`}>
                  <div className="text-[#1C2530] font-semibold text-xl cursor-pointer hover:text-[#0066FF] transition-colors" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                </Link>
                {post.excerpt?.rendered && <div className="text-[#3D4752] font-normal text-sm" dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

// Extraction for Categories Sidebar to handle its own fetching
async function SidebarSection() {
    const categories = await api.get("products/categories", { per_page: 100 }).then((res: any) => res.data).catch(() => []);
    return <CategoriesSidebar categories={categories} />;
}

// Component to handle Category Grid logic
function CategoriesDisplay({ categories }: { categories: any[] }) {
  return (
    <div className="w-full py-10 px-5 lg:px-0">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg lg:text-3xl font-bold text-[#1C2530]">Winkelen op categorie</h2>
        <div className="flex gap-2 items-center">
          <a href="/categories" className="border border-[#0066FF] text-[#0066FF] uppercase rounded-sm px-4 py-2 font-semibold text-sm hover:text-white hover:bg-[#0066FF] cursor-pointer">Bekijk alles</a>
        </div>
      </div>
      <p className="text-[#3D4752] mb-8">Bekijk al onze categorieën om te vinden wat u nodig heeft</p>
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {(Array.isArray(categories) ? categories : [])
            .filter((cat: any) => cat.parent === 0)
            .map((cat: any) => (
              <div key={cat.id} className="border border-[#DBE3EA] rounded-sm p-4 shadow-[0px_20px_24px_0px_#00000012] relative flex flex-col h-full">
                <Image className="mb-3 rounded-sm hidden lg:block" src={cat.image?.src || "/default-fallback-image.webp"} alt={cat.name} width={300} height={100} />
                <div className="mb-3 relative hidden lg:block">
                  <p className="font-semibold text-[#1C2530] text-xl">{cat.name}</p>
                  <div>
                    {categories.filter((sub: any) => sub.parent === cat.id).slice(0, 3).map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between mt-2 font-normal text-[#1C2530] text-base hover:underline cursor-pointer hover:text-[#0066FF]">
                        <span>{sub.name}</span>
                        <span>{sub.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-5 lg:hidden">
                  <Image className="mb-3 rounded-sm" src={cat.image?.src || "/default-fallback-image.webp"} alt={cat.name} width={120} height={120} />
                  <div className="mb-3 relative">
                    <p className="font-semibold text-[#1C2530] text-xl">{cat.name}</p>
                  </div>
                </div>
                <div className="w-full mt-auto">
                  <Link href={`/${cat.slug}`}>
                    <button className="!w-full border border-[#0066FF] text-[#0066FF] uppercase rounded-sm px-4 py-2 font-semibold text-sm hover:text-white hover:bg-[#0066FF] cursor-pointer">
                      Bekijk alle {cat.name}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start font-sans bg-[#F5F5F5] min-h-screen">
      <div className="max-w-[1440px] mx-auto">

        {/* Categories Sidebar + Hero Section */}
        <div className="lg:my-4 flex gap-6 w-full items-start">
          {/* Sidebar (ASYNCHRONOUS) */}
          <Suspense fallback={<div className="hidden lg:block w-[27%] h-[80vh] bg-gray-100 animate-pulse rounded-sm" />}>
            <SidebarSection />
          </Suspense>

          {/* Hero Section (SYNCHRONOUS / IMMEDIATE) */}
          <HeroSection />
        </div>

        <FadeIn className="hidden lg:flex gap-6 items-center font-sans mb-4" delay={0.1}>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card1icon.webp" alt="" width={48} height={48} />
            <p className="text-[#1C2530] font-semibold text-lg">Gegarandeerd de beste prijs</p>
            <p className="text-[#3D4752] font-normal text-sm">Wij betalen zelf ook niet graag te veel. Op 95% van ons assortiment zit een beste prijs garantie. </p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card2icon.webp" alt="" width={48} height={48} />
            <p className="text-[#1C2530] font-semibold text-lg">30 dagen retour</p>
            <p className="text-[#3D4752] font-normal text-sm">Tja, is dit nog een USP? Ook bij ons kun je spullen terugsturen als het niet is zoals je verwachtte.</p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card3icon.webp" alt="" width={48} height={48} />
            <p className="text-[#1C2530] font-semibold text-lg">De beste service</p>
            <p className="text-[#3D4752] font-normal text-sm">Het begint bij de productinformatie: bij ons is die zo compleet mogelijk. Daarna nog vragen? Wij staan voor je klaar!</p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card4icon.webp" alt="" width={48} height={48} />
            <p className="text-[#1C2530] font-semibold text-lg">Uitsluitend  A-merken</p>
            <p className="text-[#3D4752] font-normal text-sm">Er zijn genoeg sites waar je voor een tientje deurklinken koopt. Wij houden het liever bij merken die zich bewezen hebben.</p>
          </div>
        </FadeIn>

        {/* Best Sellers */}
        <Suspense fallback={<div className="w-full h-[400px] bg-gray-100 animate-pulse" />}>
          <BestSellersSection />
        </Suspense>

        {/* Recommended Products */}
        <Suspense fallback={<div className="w-full h-[400px] bg-gray-100 animate-pulse" />}>
          <RecommendedSection />
        </Suspense>

        {/* Shop by Categories */}
        <Suspense fallback={<div className="w-full h-[600px] bg-gray-100 animate-pulse" />}>
          <CategoriesSection />
        </Suspense>

        {/* Read our blog */}
        <Suspense fallback={null}>
          <BlogSection />
        </Suspense>

        {/* Bottom Content */}
        <FadeIn className="w-full py-10 px-5 lg:px-0" delay={0.6}>
          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Bouwbeslag & deurbeslag voor iedere deur – welkom bij Bouwbeslag.nl</h3>
            <p className="text-[#3D4752] font-normal text-base">Op zoek naar hoogwaardig <strong>bouwbeslag</strong> en <strong>deurbeslag</strong> voor jouw woning, kantoor of project? Bij Bouwbeslag.nl vind je uitsluitend A-merken, scherpe prijzen en vooral: échte vakmensen die met je meedenken. Van populaire bronzen deurklinken tot klassiek RVS deurbeslag en slimme oplossingen voor tocht- en geluidsisolatie – wij hebben het in huis en vertellen je precies wat je nodig hebt.</p>
            <p className="text-[#3D4752] font-normal text-base">Onze webshop is zo opgezet dat je niet hoeft te gokken: je ziet direct welke producten passen, wat de technische specificaties zijn en wanneer je ze kunt verwachten. Zo bestel je zonder zorgen het juiste beslag voor elke deur, elk raam en iedere situatie.</p>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Waarom kiezen voor Bouwbeslag.nl?</h3>
            <p className="text-[#3D4752] font-normal text-base">Altijd de laatste trends in deurbeslag</p>
            <p className="text-[#3D4752] font-normal text-base">De wereld van <strong>deurbeslag</strong> staat niet stil. Waar <strong>zwarte deurklinken</strong> de afgelopen jaren razend populair waren, zien we nu een duidelijke verschuiving richting <strong>bronzen deurklinken</strong> en warme metalen tinten. Wij volgen deze trends op de voet en zorgen dat juist díe producten ruim op voorraad zijn. Zo loop jij voorop met een interieur dat helemaal van nu is.</p>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Alle informatie vóórdat je erom vraagt</h3>
            <p className="text-[#3D4752] font-normal text-base">Bij elk artikel op Bouwbeslag.nl vind je direct:</p>
            <ul className="pl-0 space-y-2 text-[#3D4752] font-medium text-base">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
                <strong>Specificaties:</strong> afwerking, kleur, afmetingen en materiaal
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
                <strong>Voorraadstatus:</strong> duidelijk zichtbaar of het product op voorraad is
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
                <strong>Levertijd:</strong> wanneer je het bouwbeslag in huis hebt
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
                <strong>Montage-informatie:</strong> tips en waar mogelijk technische documentatie en handleidingen
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>
                Je hoeft dus niet te zoeken naar verborgen informatie: alles wat je nodig hebt, staat helder bij het product.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Uitsluitend A-merken in RVS en messing</h3>
            <p className="text-[#3D4752] font-normal text-base">Wij geloven in kwaliteit. Daarom verkopen wij alleen<strong>A-merken</strong>  zoals <strong>HABO</strong>, <strong>Mauer</strong>, <strong>JNF</strong> en <strong>Q-Lon</strong>. Geen twijfelachtige import, geen anonieme merkloze producten – maar gewoon betrouwbaar bouwbeslag waar je jarenlang plezier van hebt.</p>
            <p className="text-[#3D4752] font-normal text-base">Het grootste deel van ons assortiment bestaat uit RVS en messing. Deze materialen zijn duurzaam, mooi afgewerkt en geschikt voor intensief dagelijks gebruik. Dat is misschien een paar euro duurder dan de allergoedkoopste alternatieven, maar het bespaart je op lange termijn gedoe, slijtage en vervangen.</p>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">De goedkoopste in A-merken – met laagsteprijsgarantie</h3>
            <p className="text-[#3D4752] font-normal text-base">Kwaliteit mag betaalbaar zijn. Daarom hanteren we een duidelijke belofte: vind je bij een andere webshop in de Benelux hetzelfde A-merk product goedkoper, dan matchen wij die prijs én geven we je 10% extra korting bovenop die lagere prijs.</p>
            <p className="text-[#3D4752] font-normal text-base">Zo weet je zeker dat je bij Bouwbeslag.nl niet alleen topkwaliteit koopt, maar ook nog eens de beste prijs betaalt.</p>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Persoonlijke hulp van echte specialisten</h3>
            <p className="text-[#3D4752] font-normal text-base">Kom je er zelf even niet uit? Twijfel je tussen twee soorten deurklinken, heb je vragen over montage of wil je zeker weten dat jouw deurbeslag geschikt is voor jouw situatie? Wij helpen je graag.</p>
            <p className="text-[#3D4752] font-normal text-base">Je kunt ons bellen, appen of mailen. We denken graag met je mee, van productkeuze tot praktische toepassing op de bouwplaats of in huis. Geen anonieme webshop, maar een team dat dagelijks met bouw- en deurbeslag werkt.</p>
          </div>

          <div className="flex flex-col mb-12 p-5 lg:p-6 bg-[#FFFFFF] rounded-lg">
            <div className="mb-5">
              <h3 className="text-[#1C2530] font-semibold text-2xl">Veelgestelde vragen over bouwbeslag en deurbeslag</h3>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="faq-1" defaultChecked />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z" /></svg>
                <span className="w-[90%] lg:w-full">Wat is bouwbeslag?</span>
              </div>
              <div className="collapse-content text-sm">Bouwbeslag is de verzamelnaam voor alle zichtbare en functionele onderdelen aan deuren en ramen, zoals deurklinken, scharnieren, sloten, cilinders, tochtstrips, raamgrepen en veiligheidsbeslag. Bouwbeslag bepaalt niet alleen de uitstraling van je interieur, maar ook de veiligheid, het comfort en de levensduur van je deuren en ramen.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="faq-2" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z" /></svg>
                <span className="w-[90%] lg:w-full">Wat is het verschil tussen deurbeslag en bouwbeslag?</span>
              </div>
              <div className="collapse-content text-sm">In de praktijk is er geen verschil. Deurbeslag is simpelweg een term die specifiek verwijst naar beslag op deuren (zoals klinken, rozetten en schilden), terwijl bouwbeslag ook beslag voor ramen en andere toepassingen omvat. De termen worden vaak door elkaar gebruikt en worden gezien als synoniemen.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="faq-3" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z" /></svg>
                <span className="w-[90%] lg:w-full">Kan ik ook zakelijk bij jullie kopen?</span>
              </div>
              <div className="collapse-content text-sm">Ja, zeker. Als je actief bent in de bouw-, klus- of interieurbranche kun je bij ons een B2B-account aanmaken. Met zo’n zakelijk account profiteer je van spectaculaire inkoopprijzen eb ondersteuning bij grotere projecten. Ideaal voor aannemers, timmerbedrijven, (binnenhuis)architecten en vastgoedbeheerders.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="faq-4" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z" /></svg>
                <span className="w-[90%] lg:w-full">Leveren jullie ook in België?</span>
              </div>
              <div className="collapse-content text-sm">Ja, wij leveren naast Nederland ook in België. Tijdens het afrekenen kun je eenvoudig je afleveradres in België invullen. De verzendkosten en levertijd worden automatisch berekend. Zo kunnen ook Belgische particulieren en bedrijven profiteren van ons grote assortiment bouwbeslag en onze laagsteprijsgarantie op A-merken.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="faq-5" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z" /></svg>
                <span className="w-[90%] lg:w-full">Hoe snel wordt mijn bestelling geleverd?</span>
              </div>
              <div className="collapse-content text-sm">Producten die wij op voorraad hebben, worden in de regel binnen één werkdag verzonden. In de productdetails zie je altijd direct of een artikel op voorraad is en wat de verwachte levertijd is. Bestel je meerdere items met verschillende levertijden, dan tonen we duidelijk wat je wanneer kunt verwachten. Zo kom je nooit voor verrassingen te staan.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="faq-6" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z" /></svg>
                <span className="w-[90%] lg:w-full">Kunnen jullie me helpen bij het kiezen van het juiste deurbeslag?</span>
              </div>
              <div className="collapse-content text-sm">Ja, dat doen we dagelijks. Stuur ons gerust een foto van je huidige situatie of je bouwtekening, dan kijken we met je mee. Of je nu vragen hebt over veiligheidsbeslag, brievenbuskleppen, schuifdeurbeslag of tochtprofielen (zoals Q-Lon): wij adviseren je graag zodat je in één keer het juiste beslag bestelt.</div>
            </div>
          </div>

          {/* <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Een deurklink in alle soorten en maten</h3>
            <p className="text-[#3D4752] font-normal text-base">Bij Bouwbeslag.com vindt u deurklinken met rozetten, schilden, sleutelgaten (PC), toiletsloten, blinden en speciaal veiligheidsbeslag voor buitendeuren. De materialen variëren van roestvrij staal en messing tot aluminium en brons. Voor wie weinig onderhoud wil, zijn krasbestendige materialen zoals roestvrij staal of titanium de beste keuze. Ook kleur speelt een rol: kies voor klassiek zilver, strak zwart of een opvallende afwerking die past bij uw interieurstijl.</p>
          </div> */}
        </FadeIn>

      </div>
    </main>
  );
}
