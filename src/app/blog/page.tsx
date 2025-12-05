import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

const api = axios.create({
  baseURL: `${WP_API_URL}/wp-json/wp/v2`,
});

async function getPosts() {
  const res = await api.get("/posts", {
    params: { per_page: 50, _embed: true },
  });
  return res.data;
}

async function getCategories() {
  const res = await api.get("/categories", { params: { per_page: 100 } });
  return res.data;
}

function stripHtml(html: string = "") {
  return html.replace(/<[^>]*>/g, "");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const title = "Onze Blogs | Bouwbeslag";
  const description =
    "Lees de laatste blogs, tips en inzichten van Bouwbeslag over beslag, installatieadvies en productgidsen.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/blog`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/blog`,
      type: "website",
    },
  };
}

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getPosts(),
    getCategories(),
  ]);

  return (
    <main className=" pt-10 px-5 lg:px-0 bg-[#F5F5F5]">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-3">
          <Link href="/" className="hover:underline flex items-center gap-1 text-black">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </span>
            <span>Home</span>
          </Link>{" "}
          / Blogs
        </div>

        <h1 className="font-bold text-6xl mb-8 text-[#1C2530]">Onze Blogs</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-sans">
          {posts.map((post: any) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
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
                    {formatDate(post.date)}
                  </p>
                  <p
                    className="text-xl font-semibold hover:underline text-[#1C2530]"
                    dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                  />
                  <p className="text-[#3D4752] text-sm line-clamp-2 font-normal">
                    {stripHtml(post.excerpt?.rendered || "")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}