import fs from 'fs';

const files = [
  'src/app/[...slug]/ProductPageClient.tsx',
  'src/app/checkout/page.tsx',
  'src/app/product-template-2/[...slug]/ProductPageClientV2.tsx',
  'src/components/RecommendedProductItem.tsx',
  'src/components/BrandClient.tsx',
  'src/components/Header.tsx',
  'src/components/ShopProductCard.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Regex to safely add isB2B if it's missing in the destructured useUserContext()
  content = content.replace(
    /const\s+\{([^}]+)\}\s*=\s*useUserContext\(\)/g,
    (match, p1) => {
      if (!p1.includes('isB2B')) {
        return `const { ${p1.trim()}, isB2B } = useUserContext()`;
      }
      return match;
    }
  );

  fs.writeFileSync(file, content);
  console.log(`Fixed destructure in ${file}`);
}
