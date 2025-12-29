import { Metadata } from "next";
import api from "@/lib/woocommerce";
import CategoryClient from "./CategoryClient";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  stock_status: string;
  images: { src: string; alt: string }[];
  [key: string]: any;
}

interface AttributeTerm {
  id: number;
  name: string;
}

interface Attribute {
  id: number;
  name: string;
  terms: AttributeTerm[];
}

interface Params {
  params: Promise<{
    slug: string;
  }>;
}

async function fetchCategory(slug: string): Promise<Category | null> {
  const res = await api.get("products/categories", { slug });
  if (!res.data || res.data.length === 0) return null;
  const categoryId = res.data[0].id;
  
  // Fetch full category details by ID to ensure we get all fields (like ACF)
  try {
    const fullRes = await api.get(`products/categories/${categoryId}`);
    if (fullRes.data) {
      console.log(`Full Category Data for ID ${categoryId} (slug: ${slug}):`, JSON.stringify(fullRes.data, null, 2));
      return fullRes.data;
    }
  } catch (error) {
    console.error(`Error fetching full category details for ID ${categoryId}:`, error);
  }

  return res.data[0];
}

async function fetchAttributes(): Promise<Attribute[]> {
  const res = await api.get("products/attributes");
  const attributesData = res.data || [];
  const attributesWithTerms: Attribute[] = [];

  for (const attr of attributesData) {
    const termsRes = await fetchTermsForAttribute(attr.id);
    attributesWithTerms.push({
      id: attr.id,
      name: attr.name,
      terms: termsRes,
    });
  }

  return attributesWithTerms;
}

async function fetchTermsForAttribute(attributeId: number): Promise<AttributeTerm[]> {
  const res = await api.get(`products/attributes/${attributeId}/terms`);
  return res.data || [];
}

export async function generateMetadata(
  { params }: Params
): Promise<Metadata> {
  const { slug } = await params;

  const category = await fetchCategory(slug);

  if (!category) {
    return {
      title: "Category not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const canonicalUrl = `${siteUrl}/${slug}`;

  const title = `${category.name} | Bouwbeslag`;
  const description =
    category.description
      ?.replace(/<[^>]+>/g, "")
      .slice(0, 160) || "";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;

  const category = await fetchCategory(slug);

  if (!category) {
    return <p>Categorie niet gevonden.</p>;
  }

  const attributes = await fetchAttributes();

  const subCategoriesRes = await api.get("products/categories", {
    parent: category.id,
  });

  const subCategories = subCategoriesRes.data || [];

  return (
    <CategoryClient
      category={category}
      attributes={attributes}
      subCategories={subCategories}
      currentSlug={[slug]}
    />
  );
}
