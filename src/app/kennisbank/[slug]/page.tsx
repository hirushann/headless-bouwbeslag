import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchBlogBySlugAction } from "../../actions";

import BlockRenderer from "@/components/blog/BlockRenderer";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetchBlogBySlugAction(slug);
    const post = res.success ? res.data : null;

    if (!post) {
      return {
        title: "Blog niet gevonden",
        description: "",
      };
    }

    const seoTitle = post.seo_title || post.title;
    const seoDescription = post.seo_description || (post.excerpt ? post.excerpt.replace(/<[^>]+>/g, "") : "");
    const image = post.featured_image;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    return {
      title: seoTitle,
      description: seoDescription,
      alternates: {
        canonical: `/kennisbank/${slug}`,
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

export default async function SingleBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const res = await fetchBlogBySlugAction(slug);
  const post = res.success ? res.data : null;

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
        <span>{post.title}</span>
      </div>

      <div className="max-w-[1440px] mx-auto">
        {post.formatted_content_blocks && Array.isArray(post.formatted_content_blocks) && post.formatted_content_blocks.length > 0 ? (
          <BlockRenderer blocks={post.formatted_content_blocks} />
        ) : (
          <>
            <Image
              className="mb-3 rounded-lg h-[300px] lg:h-[480px] w-full object-cover bg-gray-100"
              src={post.featured_image || "/default-fallback-image.webp"}
              alt={post.title}
              width={1200}
              height={600}
            />

            <div className="flex flex-col gap-2">
              <p className="text-[#0050D1] font-semibold text-xl lg:text-2xl mt-5">
                {new Date(post.published_at).toLocaleDateString("nl-NL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <h1 className="text-[#1C2530] font-semibold text-4xl lg:text-6xl mt-5">
                {post.title}
              </h1>

              <div
                className="text-[#3D4752] font-normal text-base [&>p]:mb-5 max-w-none mt-5"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}