import Image from "next/image";
import Link from "next/link";
import api from "@/lib/woocommerce";
import { fetchPosts } from "@/lib/wordpress";

// Client Components
import BestSellersCarousel from "@/components/carousels/BestSellers";
import RecommendedCarousel from "@/components/carousels/Recommended";
import CategoriesSidebar from "@/components/carousels/CategoriesSidebar";

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
          <div className="w-full lg:w-[74%] lg:h-[80vh] bg-[linear-gradient(270deg,#1422AC_0%,#00074B_100.82%)] lg:rounded-sm overflow-hidden relative flex flex-col-reverse lg:flex-row items-center gap-12 py-12 lg:gap-0 lg:py-0">
            <div className="lg:w-1/2 px-5 lg:px-0 lg:pl-12 flex flex-col gap-3">
              <h1 className="text-white font-bold text-[32px] lg:text-6xl leading-[120%]">
                Excellent detailed design!
              </h1>
              <p className="font-normal text-sm lg:text-xl text-white leading-[32px]">
                Concept collections for door, window and furniture fittings.
              </p>
              <button className="flex gap-2 items-center bg-[#0066FF] rounded-sm py-2.5 lg:py-4.5 px-7 w-full justify-center lg:w-max uppercase">
                <span className="font-bold text-sm text-white leading-[22px]">Toevoegen aan winkelwagen</span>
                <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#ffffff"><path d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"/></svg></span>
              </button>
            </div>

            <div className="lg:w-1/2 flex items-center justify-center">
              <Image
                className="lg:w-full lg:h-full lg:object-contain lg:object-right rotate-340"
                src="/herobg.png"
                alt="Hero"
                width={300}
                height={200}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex gap-6 items-center font-sans mb-4">
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

        {/* Best Sellers */}
        <BestSellersCarousel products={bestSellers} />

        {/* Recommended Products */}
        {recommended?.length > 0 && (
          <RecommendedCarousel products={recommended} />
        )}

        {/* Shop by Categories */}
        <div className="w-full py-10 px-5 lg:px-0">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-[#1C2530]">Shop by categories</h2>
            <div className="flex gap-2 items-center">
              <a href="/categories" className="border border-[#0066FF] text-[#0066FF] uppercase rounded-sm px-4 py-2 font-semibold text-sm hover:text-white hover:bg-[#0066FF] cursor-pointer">View All</a>
            </div>
          </div>
          <p className="text-[#3D4752] mb-8">Check all our categories to get what you needs</p>
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
                      View all {cat.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Read our blog */}
        <div className="w-full py-10 px-5 lg:px-0">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-[#1C2530]">Read our blog</h2>
            <div className="flex gap-2 items-center">
              <a href="/blog" className="border border-[#0066FF] text-[#0066FF] uppercase rounded-sm px-4 py-2 font-semibold text-sm hover:text-white hover:bg-[#0066FF] cursor-pointer">View All</a>
            </div>
          </div>
          <p className="text-[#3D4752] mb-8">Check our latest article to get meaningfull content or tips for shopping</p>
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
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p
                      className="text-[#1C2530] font-semibold text-xl"
                      dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />
                    <p
                      className="text-[#3D4752] font-normal text-sm"
                      dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="w-full py-10 px-5 lg:px-0">
          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">The importance of quality door hardware</h3>
            <p className="text-[#3D4752] font-normal text-base">Door handles are essential in every home. They make opening and closing doors easy and contribute to the overall appearance of your interior. Because door handles are part of the door hardware, the choice of materials and finish is important. At Bouwbeslag.com, you'll find a wide range of high-quality door handles in various styles and materials.</p>
            <p className="text-[#3D4752] font-normal text-base">A door handle is a long-term investment. If you choose high-quality materials, you'll benefit from years of smooth operation and a look that perfectly complements your home. In addition to the design, it's important to consider the dimensions, finish, and durability of the hardware. This allows you to optimally combine functionality and aesthetics.</p>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">A door handle in all shapes and sizes</h3>
            <p className="text-[#3D4752] font-normal text-base">At Bouwbeslag.com, you'll find door handles with rosettes, backplates, keyholes (PC), toilet locks, blinds, and special security hardware for exterior doors. The materials range from stainless steel and brass to aluminum and bronze. For those looking for minimal maintenance, scratch-resistant materials like stainless steel or titanium are the best choice. Color also plays a role: choose classic silver, sleek black, or a striking finish that matches your interior style.</p>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">A door handle in all shapes and sizes</h3>
            <p className="text-[#3D4752] font-normal text-base">At Bouwbeslag.com, you'll find door handles with rosettes, backplates, keyholes (PC), toilet locks, blinds, and special security hardware for exterior doors. The materials range from stainless steel and brass to aluminum and bronze. For those looking for minimal maintenance, scratch-resistant materials like stainless steel or titanium are the best choice. Color also plays a role: choose classic silver, sleek black, or a striking finish that matches your interior style.</p>
            <ul className="pl-0 space-y-2 text-[#3D4752] font-medium text-base">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Unscrew the existing door handles and escutcheons or backplates.
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Pull the door handle pin out of the lock case and remove the old hardware.
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Insert the new pin through the lock and install the new hardware.
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Screw in the escutcheons or backplates and place the door handles firmly on the pin.
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" fill="#03B955"><path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/></svg>
                Test the function: check that the door handle moves smoothly and the door closes properly.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">Innovation and safety</h3>
            <p className="text-[#3D4752] font-normal text-base">With modern door handles, you combine security and ease of use. For exterior doors, security hardware with anti-drill protection is essential to keep burglars out. Our range also includes smart door handles that can be opened with Bluetooth, Wi-Fi, fingerprint scanner, card, or PIN code. These innovative solutions offer added convenience and a sense of security in your home.</p>
          </div>

          <div className="flex flex-col mb-12 p-5 lg:p-6 bg-[#FFFFFF] rounded-lg">
            <div className="mb-5">
              <h3 className="text-[#1C2530] font-semibold text-2xl">Frequently asked questions about door handles</h3>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" defaultChecked />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">What types of door handles are there?</span>
              </div>
              <div className="collapse-content text-sm">With modern door handles, you combine security and ease of use. For exterior doors, security hardware with anti-drill protection is essential to keep burglars out. Our range also includes smart door handles that can be opened with Bluetooth, Wi-Fi, fingerprint scanner, card, or PIN code. These innovative solutions offer added convenience and a sense of security in your home.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">How do I choose the right door handle for my door?</span>
              </div>
              <div className="collapse-content text-sm">With modern door handles, you combine security and ease of use. For exterior doors, security hardware with anti-drill protection is essential to keep burglars out. Our range also includes smart door handles that can be opened with Bluetooth, Wi-Fi, fingerprint scanner, card, or PIN code. These innovative solutions offer added convenience and a sense of security in your home.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">What is the difference between door handle, door handle and doorknob?</span>
              </div>
              <div className="collapse-content text-sm">With modern door handles, you combine security and ease of use. For exterior doors, security hardware with anti-drill protection is essential to keep burglars out. Our range also includes smart door handles that can be opened with Bluetooth, Wi-Fi, fingerprint scanner, card, or PIN code. These innovative solutions offer added convenience and a sense of security in your home.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">How do I remove an old door handle?</span>
              </div>
              <div className="collapse-content text-sm">With modern door handles, you combine security and ease of use. For exterior doors, security hardware with anti-drill protection is essential to keep burglars out. Our range also includes smart door handles that can be opened with Bluetooth, Wi-Fi, fingerprint scanner, card, or PIN code. These innovative solutions offer added convenience and a sense of security in your home.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">Can any door fittings be placed on any door?</span>
              </div>
              <div className="collapse-content text-sm">With modern door handles, you combine security and ease of use. For exterior doors, security hardware with anti-drill protection is essential to keep burglars out. Our range also includes smart door handles that can be opened with Bluetooth, Wi-Fi, fingerprint scanner, card, or PIN code. These innovative solutions offer added convenience and a sense of security in your home.</div>
            </div>
            <div className="collapse bg-white border-b !rounded-0 border-[#F5F5F5]">
              <input type="radio" name="my-accordion-1" />
              <div className="collapse-title font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30" fill="#0066FF"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                <span className="w-[90%] lg:w-full">What is blind door fittings or a blind door handle?</span>
              </div>
              <div className="collapse-content text-sm">With modern door handles, you combine security and ease of use. For exterior doors, security hardware with anti-drill protection is essential to keep burglars out. Our range also includes smart door handles that can be opened with Bluetooth, Wi-Fi, fingerprint scanner, card, or PIN code. These innovative solutions offer added convenience and a sense of security in your home.</div>
            </div>
          </div>

          <div className="flex flex-col gap-6 mb-12">
            <h3 className="text-[#1C2530] font-semibold text-2xl">A door handle in all shapes and sizes</h3>
            <p className="text-[#3D4752] font-normal text-base">At Bouwbeslag.com, you'll find door handles with rosettes, backplates, keyholes (PC), toilet locks, blinds, and special security hardware for exterior doors. The materials range from stainless steel and brass to aluminum and bronze. For those looking for minimal maintenance, scratch-resistant materials like stainless steel or titanium are the best choice. Color also plays a role: choose classic silver, sleek black, or a striking finish that matches your interior style.</p>
          </div>
        </div>

      </div>
    </main>
  );
}
