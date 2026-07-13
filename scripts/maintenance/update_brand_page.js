const fs = require('fs');
let content = fs.readFileSync('src/app/merken/[slug]/page.tsx', 'utf8');

const imports = `import CategoryClient from "@/components/CategoryClient";
import { cache } from "react";\n`;
content = content.replace('import Link from "next/link";', imports + 'import Link from "next/link";');

const fetchFns = `
interface AttributeTerm { id: number; name: string; }
interface Attribute { id: number; name: string; slug: string; terms: AttributeTerm[]; }

const fetchTermsForAttribute = cache(async (attributeId: number): Promise<AttributeTerm[]> => {
  try {
    const res = await api.get(\`products/attributes/\${attributeId}/terms\`, { per_page: 100, _fields: "id,name", cache: 'no-store' });
    return res.data || [];
  } catch (error) { return []; }
});

const fetchAttributes = cache(async (): Promise<Attribute[]> => {
  try {
    const res = await api.get("products/attributes", { per_page: 100, _fields: "id,name,slug", cache: 'no-store' });
    const attributesData = res.data || [];
    return await Promise.all(
      attributesData.map(async (attr: any) => {
        const termsRes = await fetchTermsForAttribute(attr.id);
        return { id: attr.id, name: attr.name, slug: attr.slug, terms: termsRes };
      })
    );
  } catch (error) { return []; }
});
`;

content = content.replace('export const dynamic', fetchFns + '\nexport const dynamic');

const heroComponent = `
  const customHero = (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/4 max-w-[200px] aspect-square flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 p-4 relative">
                 {brand.acf?.brand_logo ? (
                     <Image 
                        src={typeof brand.acf.brand_logo === 'string' ? brand.acf.brand_logo : (brand.acf.brand_logo as any).url} 
                        alt={brand.name} 
                        fill
                        sizes="(max-width: 768px) 100vw, 200px"
                        className="object-contain p-4"
                    />
                ) : (
                    <span className="text-3xl font-bold text-gray-300">{brand.name}</span>
                )}
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4 text-gray-900">{brand.name}</h1>
                <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ 
                        __html: ((brand.description && brand.description.trim() !== "") 
                            ? brand.description 
                            : (brand.acf?.brand_description || \`Bekijk ons assortiment van \${brand.name}.\`))
                            .replace(/<title[^>]*>[\\s\\S]*?<\\/title>/gi, '')
                            .replace(/<meta[^>]*>/gi, '')
                            .replace(/<link[^>]*>/gi, '')
                            .replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi, '')
                    }}
                />
            </div>
        </div>
    </div>
  );
`;

content = content.replace(
  '// 1. Fetch Aggregations (Categories) and Initial Product IDs via Elasticsearch',
  'const allAttributes = await fetchAttributes();\n\n    ' + heroComponent + '\n\n    // 1. Fetch Aggregations'
);

const oldGridRegex = /<div className="flex flex-col lg:flex-row gap-8">.*?<\/aside>.*?<\/div>.*?<\/div>/s;
content = content.replace(oldGridRegex, `
            <CategoryClient
                category={brand}
                subCategories={[]}
                currentSlug={[slug]}
                initialProducts={filteredProducts}
                initialTotalPages={Math.ceil(allProductsCount / 60) || 1}
                initialTotalProducts={allProductsCount}
                isBrandPage={true}
                customHero={customHero}
            />
`);

// We also need to remove the Brand Header / Hero from rendering independently, since it's now inside customHero
const oldHeroRegex = /{\/\* Brand Header \/ Hero \*\/}.*?<div className="flex-1">\s*<h1 className="text-3xl font-bold mb-4 text-gray-900">.*?<\/div>\s*<\/div>\s*<\/div>/s;
content = content.replace(oldHeroRegex, '');

fs.writeFileSync('src/app/merken/[slug]/page.tsx', content);
console.log('Updated BrandPage');
