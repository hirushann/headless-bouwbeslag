import Image from "next/image";
import Link from "next/link";
import api from "@/lib/woocommerce";
import { fetchPosts } from "@/lib/wordpress";

// Client Components
import BestSellersCarousel from "@/components/carousels/BestSellers";
import RecommendedCarousel from "@/components/carousels/Recommended";
import CategoriesSidebar from "@/components/carousels/CategoriesSidebar";
import HeroSection from "@/components/HeroSection";
import FadeIn from "@/components/animations/FadeIn";

export default async function Home() {
  const bestSellers = await api
    .get("products", { per_page: 10 })
    .then((res: any) => res.data)
    .catch(() => []);

  const recommended = await api
    .get("products", { featured: true, per_page: 10 })
    .then((res: any) => res.data)
    .catch(() => []);

  const categories = await api
    .get("products/categories", { per_page: 50 })
    .then((res: any) => res.data)
    .catch(() => []);

  const posts = await fetchPosts(3).catch(() => []);

  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start font-sans bg-[#F5F5F5]">
      <div className="max-w-[1440px] mx-auto">

        {/* Categories Sidebar + Hero Section */}
        <div className="lg:my-4 flex gap-6 w-full">

          {/* Sidebar (CLIENT) */}
          <CategoriesSidebar categories={categories} />

          {/* Hero Section */}
          <HeroSection />
        </div>

        <FadeIn className="hidden lg:flex gap-6 items-center font-sans mb-4" delay={0.2}>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card1icon.png" alt="" width={48} height={48} />
            <h2 className="text-[#1C2530] font-semibold text-lg">Gegarandeerd de beste prijs</h2>
            <p className="text-[#3D4752] font-normal text-sm">Wij betalen zelf ook niet graag te veel. Op 95% van ons assortiment zit een beste prijs garantie. </p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card2icon.png" alt="" width={48} height={48} />
            <h2 className="text-[#1C2530] font-semibold text-lg">30 dagen retour</h2>
            <p className="text-[#3D4752] font-normal text-sm">Tja, is dit nog een USP? Ook bij ons kun je spullen terugsturen als het niet is zoals je verwachtte.</p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card3icon.png" alt="" width={48} height={48} />
            <h2 className="text-[#1C2530] font-semibold text-lg">De beste service</h2>
            <p className="text-[#3D4752] font-normal text-sm">Het begint bij de productinformatie: bij ons is die zo compleet mogelijk. Daarna nog vragen? Wij staan voor je klaar!</p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card4icon.png" alt="" width={48} height={48} />
            <h2 className="text-[#1C2530] font-semibold text-lg">Uitsluitend  A-merken</h2>
            <p className="text-[#3D4752] font-normal text-sm">Er zijn genoeg sites waar je voor een tientje deurklinken koopt. Wij houden het liever bij merken die zich bewezen hebben.</p>
          </div>
        </FadeIn>

        {/* Best Sellers */}
        {/* Best Sellers */}
        <FadeIn delay={0.3}>
          <BestSellersCarousel products={bestSellers} />
        </FadeIn>

        {/* Recommended Products */}
        {recommended?.length > 0 && (
          <FadeIn delay={0.4}>
            <RecommendedCarousel products={recommended} />
          </FadeIn>
        )}

        {/* Shop by Categories */}
        <div className="w-full py-10 px-5 lg:px-0">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-[#1C2530]">Winkelen op categorie</h2>
            <div className="flex gap-2 items-center">
              <a href="/categories" className="border border-[#0066FF] text-[#0066FF] uppercase rounded-sm px-4 py-2 font-semibold text-sm hover:text-white hover:bg-[#0066FF] cursor-pointer">Bekijk alles</a>
            </div>
          </div>
          <p className="text-[#3D4752] mb-8">Bekijk al onze categorieën om te vinden wat u nodig heeft</p>
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {categories
                .filter((cat: { parent: number }) => cat.parent === 0)
                .map((cat: { id: number; name: string; image?: { src?: string }; parent: number; count?: number }) => (
                <div key={cat.id} className="border border-[#DBE3EA] rounded-sm p-4 shadow-[0px_20px_24px_0px_#0000000A] relative flex flex-col h-full">
                  <Image
                    className="mb-3 rounded-sm hidden lg:block"
                    src={cat.image?.src || "/default-fallback-image.png"}
                    alt={cat.name}
                    width={300}
                    height={100}
                  />
                  <div className="mb-3 relative hidden lg:block">
                    <p className="font-semibold text-[#1C2530] text-xl">{cat.name}</p>
                    <div>
                      {categories
                        .filter((sub: any) => sub.parent === cat.id)
                        .slice(0, 3)
                        .map((sub: any) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between mt-2 font-normal text-[#1C2530] text-base hover:underline cursor-pointer hover:text-[#0066FF]"
                          >
                            <span>{sub.name}</span>
                            <span>{sub.count}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex gap-5  lg:hidden">
                    <Image className="mb-3 rounded-sm" src={cat.image?.src || "/default-fallback-image.png"} alt={cat.name} width={120} height={250} />
                    <div className="mb-3 relative">
                      <p className="font-semibold text-[#1C2530] text-xl">{cat.name}</p>
                      <div>
                        {categories
                          .filter((sub: any) => sub.parent === cat.id)
                          .slice(0, 3)
                          .map((sub: any) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between mt-2 font-normal text-[#1C2530] text-base hover:underline cursor-pointer hover:text-[#0066FF]"
                            >
                              <span>{sub.name}</span>
                              <span>{sub.count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="w-full mt-auto">
                    <button className="!w-full border border-[#0066FF] text-[#0066FF] uppercase rounded-sm px-4 py-2 font-semibold text-sm hover:text-white hover:bg-[#0066FF] cursor-pointer">
                      Bekijk alle {cat.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Read our blog */}
        <FadeIn className="w-full py-10 px-5 lg:px-0" delay={0.5}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-[#1C2530]">Lees onze blog</h2>
            <div className="flex gap-2 items-center">
              <a href="/blog" className="border border-[#0066FF] text-[#0066FF] uppercase rounded-sm px-4 py-2 font-semibold text-sm hover:text-white hover:bg-[#0066FF] cursor-pointer">Bekijk alles</a>
            </div>
          </div>
          <p className="text-[#3D4752] mb-8">Bekijk ons laatste artikel voor zinvolle inhoud of winkeltips</p>
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {posts.map((post: { id: number; title: { rendered: string }; excerpt: { rendered: string }; date: string; _embedded?: any }) => (
                <div key={post.id}>
                  <Image
                    className="mb-3 rounded-sm h-[250px] w-full object-cover"
                    src={
                      post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
                      post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.full?.source_url ||
                      "/default-fallback-image.png"
                    }
                    alt={post.title.rendered}
                    width={500}
                    height={200}
                  />
                  <div className="flex flex-col gap-2">
                    <p className="text-[#0066FF] font-normal text-sm">
                      {new Date(post.date).toISOString().split("T")[0]}
                    </p>
                    <div
                      className="text-[#1C2530] font-semibold text-xl"
                      dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />
                    {post.excerpt?.rendered ? (
                      <div
                        className="text-[#3D4752] font-normal text-sm"
                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Bottom Content */}
        <FadeIn className="w-full py-10 px-5 lg:px-0" delay={0.6}>
          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Het belang van kwaliteitsdeurbeslag</h3>
            <p className="text-[#3D4752] font-normal text-base">Deurklinken zijn onmisbaar in elk huis. Ze maken het openen en sluiten van deuren eenvoudig en dragen bij aan de algehele uitstraling van uw interieur. Omdat deurklinken onderdeel zijn van het deurbeslag, is de keuze van materialen en afwerking belangrijk. Bij Bouwbeslag.com vindt u een breed scala aan hoogwaardige deurklinken in diverse stijlen en materialen.</p>
            <p className="text-[#3D4752] font-normal text-base">Een deurklink is een investering voor de lange termijn. Kiest u voor hoogwaardige materialen, dan profiteert u jarenlang van een soepele werking en een uitstraling die perfect bij uw woning past. Naast het design is het belangrijk om te letten op de afmetingen, afwerking en duurzaamheid van het beslag. Zo combineert u functionaliteit en esthetiek optimaal.</p>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Een deurklink in alle soorten en maten</h3>
            <p className="text-[#3D4752] font-normal text-base">Bij Bouwbeslag.com vindt u deurklinken met rozetten, schilden, sleutelgaten (PC), toiletsloten, blinden en speciaal veiligheidsbeslag voor buitendeuren. De materialen variëren van roestvrij staal en messing tot aluminium en brons. Voor wie weinig onderhoud wil, zijn krasbestendige materialen zoals roestvrij staal of titanium de beste keuze. Ook kleur speelt een rol: kies voor klassiek zilver, strak zwart of een opvallende afwerking die past bij uw interieurstijl.</p>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Een deurklink in alle soorten en maten</h3>
            <p className="text-[#3D4752] font-normal text-base">Bij Bouwbeslag.com vindt u deurklinken met rozetten, schilden, sleutelgaten (PC), toiletsloten, blinden en speciaal veiligheidsbeslag voor buitendeuren. De materialen variëren van roestvrij staal en messing tot aluminium en brons. Voor wie weinig onderhoud wil, zijn krasbestendige materialen zoals roestvrij staal of titanium de beste keuze. Ook kleur speelt een rol: kies voor klassiek zilver, strak zwart of een opvallende afwerking die past bij uw interieurstijl.</p>
            <ul className="pl-0 space-y-2 text-[#3D4752] font-medium text-base">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Schroef de bestaande deurklinken en rozetten of schilden los.
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Trek de deurklinkstift uit de slotkast en verwijder het oude beslag.
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Steek de nieuwe stift door het slot en monteer het nieuwe beslag.
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Schroef de rozetten of schilden vast en plaats de deurklinken stevig op de stift.
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Test de werking: controleer of de deurklink soepel beweegt en de deur goed sluit.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Innovatie en veiligheid</h3>
            <p className="text-[#3D4752] font-normal text-base">Met moderne deurklinken combineert u veiligheid en gebruiksgemak. Voor buitendeuren is veiligheidsbeslag met kerntrekbeveiliging essentieel om inbrekers buiten te houden. Ons assortiment omvat ook slimme deurklinken die geopend kunnen worden met Bluetooth, wifi, vingerafdrukscanner, kaart of pincode. Deze innovatieve oplossingen bieden extra gemak en een veilig gevoel in uw woning.</p>
          </div>

          <div className="flex flex-col mb-12 p-5 lg:p-6 bg-[#FFFFFF] rounded-lg">
            <div className="mb-5">
              <h3 className="text-[#1C2530] font-semibold text-2xl">Veelgestelde vragen over deurklinken</h3>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" defaultChecked />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">Welke soorten deurklinken zijn er?</span>
              </div>
              <div className="collapse-content text-sm">Met moderne deurklinken combineert u veiligheid en gebruiksgemak. Voor buitendeuren is veiligheidsbeslag met kerntrekbeveiliging essentieel om inbrekers buiten te houden. Ons assortiment omvat ook slimme deurklinken die geopend kunnen worden met Bluetooth, wifi, vingerafdrukscanner, kaart of pincode. Deze innovatieve oplossingen bieden extra gemak en een veilig gevoel in uw woning.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">Hoe kies ik de juiste deurklink voor mijn deur?</span>
              </div>
              <div className="collapse-content text-sm">Met moderne deurklinken combineert u veiligheid en gebruiksgemak. Voor buitendeuren is veiligheidsbeslag met kerntrekbeveiliging essentieel om inbrekers buiten te houden. Ons assortiment omvat ook slimme deurklinken die geopend kunnen worden met Bluetooth, wifi, vingerafdrukscanner, kaart of pincode. Deze innovatieve oplossingen bieden extra gemak en een veilig gevoel in uw woning.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">Wat is het verschil tussen een deurklink, deurkruk en deurknop?</span>
              </div>
              <div className="collapse-content text-sm">Met moderne deurklinken combineert u veiligheid en gebruiksgemak. Voor buitendeuren is veiligheidsbeslag met kerntrekbeveiliging essentieel om inbrekers buiten te houden. Ons assortiment omvat ook slimme deurklinken die geopend kunnen worden met Bluetooth, wifi, vingerafdrukscanner, kaart of pincode. Deze innovatieve oplossingen bieden extra gemak en een veilig gevoel in uw woning.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">Hoe verwijder ik een oude deurklink?</span>
              </div>
              <div className="collapse-content text-sm">Met moderne deurklinken combineert u veiligheid en gebruiksgemak. Voor buitendeuren is veiligheidsbeslag met kerntrekbeveiliging essentieel om inbrekers buiten te houden. Ons assortiment omvat ook slimme deurklinken die geopend kunnen worden met Bluetooth, wifi, vingerafdrukscanner, kaart of pincode. Deze innovatieve oplossingen bieden extra gemak en een veilig gevoel in uw woning.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">Kan elk deurbeslag op elke deur geplaatst worden?</span>
              </div>
              <div className="collapse-content text-sm">Met moderne deurklinken combineert u veiligheid en gebruiksgemak. Voor buitendeuren is veiligheidsbeslag met kerntrekbeveiliging essentieel om inbrekers buiten te houden. Ons assortiment omvat ook slimme deurklinken die geopend kunnen worden met Bluetooth, wifi, vingerafdrukscanner, kaart of pincode. Deze innovatieve oplossingen bieden extra gemak en een veilig gevoel in uw woning.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">Wat is blind deurbeslag of een blinde deurklink?</span>
              </div>
              <div className="collapse-content text-sm">Met moderne deurklinken combineert u veiligheid en gebruiksgemak. Voor buitendeuren is veiligheidsbeslag met kerntrekbeveiliging essentieel om inbrekers buiten te houden. Ons assortiment omvat ook slimme deurklinken die geopend kunnen worden met Bluetooth, wifi, vingerafdrukscanner, kaart of pincode. Deze innovatieve oplossingen bieden extra gemak en een veilig gevoel in uw woning.</div>
            </div>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Een deurklink in alle soorten en maten</h3>
            <p className="text-[#3D4752] font-normal text-base">Bij Bouwbeslag.com vindt u deurklinken met rozetten, schilden, sleutelgaten (PC), toiletsloten, blinden en speciaal veiligheidsbeslag voor buitendeuren. De materialen variëren van roestvrij staal en messing tot aluminium en brons. Voor wie weinig onderhoud wil, zijn krasbestendige materialen zoals roestvrij staal of titanium de beste keuze. Ook kleur speelt een rol: kies voor klassiek zilver, strak zwart of een opvallende afwerking die past bij uw interieurstijl.</p>
          </div>
        </FadeIn>

      </div>
    </main>
  );
}
