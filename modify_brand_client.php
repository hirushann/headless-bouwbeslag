<?php
$file = 'src/components/BrandClient.tsx';
$content = file_get_contents($file);

// 1. Rename Component and Props
$content = str_replace('export default function CategoryClient', 'export default function BrandClient', $content);
$content = preg_replace('/interface CategoryClientProps \{.*?\}/s', "interface BrandClientProps {\n  brand: any;\n  currentSlug: string;\n  initialProducts: any[];\n  initialTotalPages: number;\n  initialTotalProducts: number;\n  children?: React.ReactNode;\n  categorySlug?: string;\n  allAttributes: any[];\n}", $content);
$content = str_replace('CategoryClientProps', 'BrandClientProps', $content);

// 2. Adjust props destructuring
$content = preg_replace('/\{[\s\S]*?\}: BrandClientProps/', '{ brand, currentSlug, initialProducts, initialTotalPages, initialTotalProducts, children, categorySlug, allAttributes }: BrandClientProps', $content);

// 3. Replace category with brand for flags
$content = str_replace('category.', 'brand.', $content);
$content = str_replace('category?.', 'brand?.', $content);
// Fix some category variables that shouldn't be brand
$content = preg_replace('/const categorySlug = brand\.slug;/', 'const categorySlugVar = brand.slug;', $content);
$content = str_replace('`category_slug = ${categorySlug}`', '`category_slug = ${categorySlug}`', $content); // Leave fetch Meili as is, we will fix below.

// 4. Update fetch URL for pagination (fetchCurrentPage inside useEffect)
// In CategoryClient, it fetches: const filters = [`category_slug = ${currentSlug}`];
// We need to change this to filter by brand_id and optionally category_slug.
$content = preg_replace('/const filters = \[`category_slug = \$\{currentSlug\}`\];/', "const filters = [`brand_id = '\${currentSlug}'`];\n      if (categorySlug) filters.push(`category_slug = '\${categorySlug}'`);", $content);

// 5. Remove CategoryBreadcrumbs
$content = str_replace('import CategoryBreadcrumbs from "@/components/CategoryBreadcrumbs";', '', $content);
$content = preg_replace('/<CategoryBreadcrumbs[^>]*\/>/', '', $content);

// 6. Replace header rendering with {children}
$content = preg_replace('/<h1 className="text-4xl font-bold text-\\[#1C2530\\] mb-4">.*?<div className="text-gray-600 text-sm md:text-base leading-relaxed max-w-none" dangerouslySetInnerHTML={{ __html:.*?<\/div>/s', '{children}', $content);

// 7. Remove Subcategories grid
$content = preg_replace('/\{resolvedSubCats && resolvedSubCats\.length > 0 && \(.*?\)\}/s', '', $content);

// 8. Disable Brand Filter
$content = preg_replace('/isBrandsEnabled = !!brand\.acf\?\.brands \|\| !!brand\?\.brands;/', 'isBrandsEnabled = false;', $content);
$content = preg_replace('/const availableBrands = useMemo\(\(\) => \{[\s\S]*?\}, \[allCategoryProductsForFilters\]\);/s', 'const availableBrands: any[] = [];', $content);
$content = str_replace('categoryBrands={categoryBrands}', '', $content);
$content = str_replace('categoryBrands', '[]', $content);
$content = str_replace('subCategories={subCategoriesPromise}', '', $content);
$content = str_replace('subCategories', 'null', $content);

file_put_contents($file, $content);
echo "BrandClient refactored.\n";
