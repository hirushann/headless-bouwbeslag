import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/woocommerce";
import CategoriesGrid from "@/components/CategoriesGrid";

interface Category {
  id: number;
  name: string;
  image: { src: string } | null;
  parent: number;
  slug: string;
  count: number;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const title = "Shop categories | Bouwbeslag";
  const description =
    "Bekijk alle productcategorieën bij Bouwbeslag. Ontdek hoogwaardige deurklinken, beslag en accessoires met snelle levering en garantie.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/categories`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/categories`,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Categories() {
  let categories: Category[] = [];

  try {
    const res = await api.get("products/categories", { per_page: 50 });
    categories = Array.isArray(res.data) ? res.data : [];
  } catch (err: any) {
    console.error("Error fetching categories:", err.response?.data || err.message);
  }

  console.log("--- DEBUG CATEGORIES PAGE ---");
  console.log("Categories found:", categories.length);
  console.log("-----------------------------");

  return (
    <main className="font-sans bg-[#F7F7F7]">
        <div className="max-w-[1440px] mx-auto px-1 py-10 ">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
                <Link href="/" className="hover:underline flex items-center gap-1 text-black">
                <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg></span>
                <span>Home</span>
                </Link>{" "}
                / Alle categorieën
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-bold text-[#1C2530] mb-2">Winkel op categorie</h1>
            <p className="text-gray-600 mb-8 text-sm font-normal">
                Bekijk al onze categorieën om te vinden wat je nodig hebt
            </p>

            {/* Categories Grid */}
            <CategoriesGrid categories={categories} />
        </div>
        <div className="bg-white py-5">
            <div className="max-w-[1440px] mx-auto px-1">
                <div className="flex gap-6 items-center font-sans mb-4">
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
                </div>
            </div>
        </div>
    </main>
  );
}