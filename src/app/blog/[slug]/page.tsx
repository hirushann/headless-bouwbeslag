"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const api = axios.create({
  baseURL: `${WP_API_URL}/wp-json/wp/v2`,
});

interface Post {
  id: number;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: {
      source_url?: string;
      media_details?: {
        sizes?: {
          full?: { source_url?: string };
        };
      };
    }[];
  };
}

export default function SingleBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadPost() {
      try {
        const res = await api.get(`/posts/${slug}`, { params: { _embed: true } });
        if (!cancelled && res.data) {
          setPost(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
    return () => {
      cancelled = true;
    };
  }, [slug]);

if (loading || !post) {
  return (
    <div className="max-w-[1440px] mx-auto py-10 px-5 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-3 bg-gray-200 rounded" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <div className="h-4 w-3 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>

      

      {/* Content skeleton */}
      <div className="flex flex-col gap-4 max-w-[1024px] mx-auto">
        <div className="w-full h-[480px] bg-gray-200 rounded-lg mb-6" />
        <div className="h-6 w-1/3 bg-gray-200 rounded" />
        <div className="h-12 w-2/3 bg-gray-200 rounded" />
        <div className="space-y-4 mt-4">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
          <div className="h-4 w-4/6 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

  return (
    <div key={post.id} className="max-w-[1440px] mx-auto py-10 px-5 lg:px-0">
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
          <Link href="/" className="hover:underline flex items-center gap-1 text-black">
          <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg></span>
          <span>Home</span>
          </Link>{" "}
          / <Link href="/blog" > Blogs </Link>
          / <span dangerouslySetInnerHTML={{ __html: post.title.rendered }}/>
      </div>
      <div className="max-w-[1024px] mx-auto py-5">
        <Image
          className="mb-3 rounded-lg h-[300px] lg:h-[480px] w-full object-cover"
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
          <p className="text-[#0066FF] font-semibold text-xl lg:text-2xl mt-5">
            {new Date(post.date).toLocaleDateString("en-NL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1
            className="text-[#1C2530] font-semibold text-4xl lg:text-6xl mt-5"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />
          <div
            className="text-[#3D4752] font-normal text-base [&>p]:mb-5 max-w-none mt-5"
            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
          />
        </div>
      </div>
    </div>
  );
}