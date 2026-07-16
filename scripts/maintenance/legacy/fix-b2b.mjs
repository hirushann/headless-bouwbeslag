import fs from 'fs';
import path from 'path';

const files = [
  'src/app/[...slug]/ProductPageClient.tsx',
  'src/app/checkout/page.tsx',
  'src/app/product-template-2/[...slug]/ProductPageClientV2.tsx',
  'src/components/RecommendedProductItem.tsx',
  'src/components/BrandClient.tsx',
  'src/components/ProductCard.tsx',
  'src/components/Header.tsx',
  'src/components/ShopProductCard.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  console.log(`Checking ${file}... has user? ${content.includes('const { user') || content.includes('const { user,') || content.includes('user, userRole')}`);
}
