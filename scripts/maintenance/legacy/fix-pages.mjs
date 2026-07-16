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

  // Replace context destructuring to include isB2B
  content = content.replace(
    'const { user, userRole, isLoading } = useUserContext();',
    'const { user, userRole, isLoading, isB2B } = useUserContext();'
  );
  content = content.replace(
    'const { user, userRole } = useUserContext();',
    'const { user, userRole, isB2B } = useUserContext();'
  );
  content = content.replace(
    'const { userRole } = useUserContext();',
    'const { userRole, isB2B } = useUserContext();'
  );

  // Replace isB2B definition
  content = content.replace(
    /const isB2B = userRole && \(userRole\.includes\("b2b_customer"\) \|\| userRole\.includes\("administrator"\)\);/g,
    '// isB2B is already destructured from useUserContext'
  );
  // Remove commented out duplicates
  content = content.replace(
    /\/\/ isB2B is already destructured from useUserContext/g,
    ''
  );

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
