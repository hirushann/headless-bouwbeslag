import { Metadata } from "next";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

const api = axios.create({
  baseURL: `${WP_API_URL}/wp-json/wp/v2`,
});

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await api.get("/posts", {
      params: {
        slug,
        _embed: true,
      },
    });

    const post = Array.isArray(res.data) && res.data[0] ? res.data[0] : null;

    if (!post) {
      return {
        title: "Blog niet gevonden",
        description: "",
      };
    }

    const seoTitle =
      post.rank_math_title ||
      post.yoast_head_json?.title ||
      post.title?.rendered;

    const seoDescription =
      post.rank_math_description ||
      post.yoast_head_json?.description ||
      post.excerpt?.rendered?.replace(/<[^>]+>/g, "");

    const image =
      post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ??
      post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.full
        ?.source_url;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    return {
      title: seoTitle,
      description: seoDescription,
      alternates: {
        canonical: `${siteUrl}/kennisbank/${slug}`,
      },
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: "article",
        url: `${siteUrl}/kennisbank/${slug}`,
        images: image ? [{ url: image }] : [],
      },
    };
  } catch {
    return {
      title: "Blog",
      description: "",
    };
  }
}

async function getPostBySlug(slug: string) {
  const res = await api.get("/posts", {
    params: {
      slug,
      _embed: true,
    },
  });

  return Array.isArray(res.data) && res.data[0] ? res.data[0] : null;
}

export default async function SingleBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await getPostBySlug(slug);

  if (!post) {
    return (
      <div className="max-w-[1440px] mx-auto py-10 px-5">
        <h1 className="text-2xl font-semibold">Bericht niet gevonden</h1>
      </div>
    );
  }

  return (
    <div key={post.id} className="max-w-[1440px] mx-auto py-10 px-5 lg:px-0">
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="hover:underline flex items-center gap-1 text-black"
        >
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </span>
          <span>Home</span>
        </Link>
        / <Link href="/kennisbank">Kennisbank</Link>
        /{" "}
        <span
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
      </div>

      <div className="max-w-[1024px] mx-auto py-5">
        <Image
          className="mb-3 rounded-lg h-[300px] lg:h-[480px] w-full object-cover"
          src={
            post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
            post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes
              ?.full?.source_url ||
            "/default-fallback-image.png"
          }
          alt={post.title.rendered}
          width={1200}
          height={600}
        />

        <div className="flex flex-col gap-2">
          <p className="text-[#0066FF] font-semibold text-xl lg:text-2xl mt-5">
            {new Date(post.date).toLocaleDateString("nl-NL", {
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