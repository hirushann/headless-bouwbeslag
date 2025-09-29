"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchPosts, fetchCategories } from "@/lib/wordpress";

interface Post {
  id: number;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  categories: number[];
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string }[];
  };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  useEffect(() => {
    let cancelled = false;
    fetchPosts(50, { _embed: true }) // fetch more posts to allow for category filtering and load more, with _embed
      .then((res) => {
        if (!cancelled) {
          // Ensure each post contains categories array
          const postsWithCategories = res.map((post: any) => {
            console.log("Post categories:", post.categories);
            return {
              ...post,
              categories: post.categories || [],
            };
          });
          setPosts(postsWithCategories);
        }
      })
      .finally(() => setLoading(false));

    // Fetch categories
    fetchCategories()
      .then((cats) => {
        console.log("Fetched categories:", cats);
        if (!cancelled) {
          const mapped = cats.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }));
          setCategories(mapped);
        }
      })
      .catch(() => {
        // ignore category errors
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter posts by selected category
  const filteredPosts = selectedCategory === 0
    ? posts
    : posts.filter((post) => post.categories.includes(selectedCategory));

  // Posts to display (visibleCount logic)
  const postsToShow = filteredPosts.slice(0, visibleCount);

  return (
    <main className=" pt-10 px-5 lg:px-0 bg-[#F5F5F5]">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
            <Link href="/" className="hover:underline flex items-center gap-1 text-black">
            <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg></span>
            <span>Home</span>
            </Link>{" "}
            / Blogs
        </div>

        <h1 className="font-bold text-6xl mb-8 text-[#1C2530]">Our Blogs</h1>

        {/* Category Buttons */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            className={`bg-[#EDF4FF] px-4 py-2 rounded-sm border border-[#D0DFEE] font-medium transition-colors cursor-pointer ${
              selectedCategory === 0
                ? "text-[#0066FF] !border-[#0066FF] border"
                : "bg-white text-[#1C2530] hover:bg-[#F3F6FA]"
            }`}
            onClick={() => {
              setSelectedCategory(0);
              setVisibleCount(12);
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`bg-[#EDF4FF] px-4 py-2 rounded-sm border border-[#D0DFEE] font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "text-[#0066FF] !border-[#0066FF] border"
                  : "bg-white text-[#1C2530] hover:bg-[#F3F6FA]"
              }`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setVisibleCount(12);
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {(loading || posts.length === 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-sans">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-0 rounded-md overflow-hidden animate-pulse">
                <div className="w-full h-[250px] bg-gray-200" />
                <div className="py-4 px-1 flex flex-col gap-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  <div className="h-6 w-2/3 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-sans">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-0 rounded-md overflow-hidden animate-pulse">
                <div className="w-full h-[250px] bg-gray-200" />
                <div className="py-4 px-1 flex flex-col gap-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  <div className="h-6 w-2/3 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-sans">
              {postsToShow.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`}>
                  <div className="border-0 rounded-md overflow-hidden">
                    <Image
                      src={
                        post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
                        "/default-fallback-image.png"
                      }
                      alt={post.title.rendered}
                      width={600}
                      height={400}
                      className="w-full h-[250px] object-cover rounded-sm"
                    />
                    <div className="py-4 px-1 flex flex-col gap-2">
                      <p className="text-[#0066FF] text-sm">
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <h2
                        className="text-xl font-semibold hover:underline text-[#1C2530]"
                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                      />
                      <p
                        className="text-[#3D4752] text-sm line-clamp-2 font-normal"
                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {filteredPosts.length > postsToShow.length && (
              <div className="flex justify-center mt-8">
                <button
                  className="px-7 py-4 rounded-sm bg-[#0066FF] text-white font-semibold hover:bg-[#0056d6] transition-colors uppercase cursor-pointer"
                  onClick={() => setVisibleCount((c) => c + 6)}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="py-20 bg-white mt-12">
        <div className="max-w-[1440px] mx-auto hidden lg:flex gap-6 items-center font-sans">
            <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card1icon.png" alt="" width={48} height={48} />
            <h2 className="text-[#1C2530] font-semibold text-lg">Guaranteed the cheapest</h2>
            <p className="text-[#3D4752] font-normal text-sm">Find this product cheaper elsewhere? We'll match the price and give you an extra 10% discount.</p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card2icon.png" alt="" width={48} height={48} />
            <h2 className="text-[#1C2530] font-semibold text-lg">30-day return policy</h2>
            <p className="text-[#3D4752] font-normal text-sm">Return your order within 30 days and you will receive a refund of the amount you paid.</p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card3icon.png" alt="" width={48} height={48} />
            <h2 className="text-[#1C2530] font-semibold text-lg">Pay safely and quickly</h2>
            <p className="text-[#3D4752] font-normal text-sm">You can choose and pay for your preferred payment method via our PSP Mollie.</p>
          </div>
          <div className="shadow-[0px_20px_24px_0px_#0000000A] rounded-sm bg-white p-5 flex flex-col gap-2">
            <Image className="" src="/card4icon.png" alt="" width={48} height={48} />
            <h2 className="text-[#1C2530] font-semibold text-lg">Renowned brands</h2>
            <p className="text-[#3D4752] font-normal text-sm">We sell renowned brands such as JNF, GPF, Mauer, Mi Satori, M&T, Zoo Hardware</p>
          </div>
        </div>
      </div>
    </main>
  );
}