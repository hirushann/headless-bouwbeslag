const fs = require('fs');
let content = fs.readFileSync('src/app/api/category-filters/route.ts', 'utf8');

// 1. Update fetchEmpireCategoryFlags
content = content.replace(
  'async function fetchEmpireCategoryFlags(slug: string) {',
  'async function fetchEmpireCategoryFlags(slug: string, isBrandPage: boolean = false) {'
);
content = content.replace(
  'const res = await fetch(`${EMPIRE_BASE}/categories/${slug}`, {',
  'const endpoint = isBrandPage ? `brands/${slug}` : `categories/${slug}`;\n    const res = await fetch(`${EMPIRE_BASE}/${endpoint}`, {'
);

// 2. Update fetchMeiliFilterFacets
content = content.replace(
  'async function fetchMeiliFilterFacets(categorySlug: string) {',
  'async function fetchMeiliFilterFacets(categorySlug: string, isBrandPage: boolean = false) {'
);
content = content.replace(
  'filter: [`category_slug = ${categorySlug}`],',
  'filter: [isBrandPage ? `brand_id = \'${categorySlug}\'` : `category_slug = ${categorySlug}`],'
);

// 3. Update fetchFilterBaseProducts
content = content.replace(
  'async function fetchFilterBaseProducts(categorySlug: string) {',
  'async function fetchFilterBaseProducts(categorySlug: string, isBrandPage: boolean = false) {'
);
content = content.replace(
  'filter: [`category_slug = ${categorySlug}`],',
  'filter: [isBrandPage ? `brand_id = \'${categorySlug}\'` : `category_slug = ${categorySlug}`],'
);

// 4. Update GET handler
content = content.replace(
  "const categoryId = searchParams.get('categoryId'); // kept for backward compat",
  "const categoryId = searchParams.get('categoryId'); // kept for backward compat\n  const isBrandPage = searchParams.get('isBrandPage') === 'true';"
);
content = content.replace(
  'fetchEmpireCategoryFlags(slug),',
  'fetchEmpireCategoryFlags(slug, isBrandPage),'
);
content = content.replace(
  'fetchMeiliFilterFacets(slug),',
  'fetchMeiliFilterFacets(slug, isBrandPage),'
);
content = content.replace(
  'fetchFilterBaseProducts(slug),',
  'fetchFilterBaseProducts(slug, isBrandPage),'
);

fs.writeFileSync('src/app/api/category-filters/route.ts', content);
console.log('Updated category-filters API route');
