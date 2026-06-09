const fs = require('fs');
const file = 'src/app/product-template-2/[...slug]/ProductPageClientV2.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Create the block
const block = `
  const productMetaMap = React.useMemo(() => {
    const map = {};
    if (product?.meta_data) {
      for (const m of product.meta_data) {
        map[m.key] = m.value;
      }
    }
    return map;
  }, [product?.meta_data]);

  const getMetaValue = React.useCallback((key) => {
    return productMetaMap[key] || null;
  }, [productMetaMap]);

  const getMeta = getMetaValue;
`;

// 2. Insert the block at line 148 or similar (where getMeta is defined at top)
// wait, let's find the original getMeta / getMetaValue.

// Remove original getMetaValue
content = content.replace(/const getMetaValue = \(key: string\) =>\s+product\?\.meta_data\?\.find\(\(m: any\) => m\.key === key\)\?\.value \|\| null;/, '');

// Remove top level getMeta
content = content.replace(/const getMeta = \(key: string\) => product\?\.meta_data\?\.find\(\(m: any\) => m\.key === key\)\?\.value;/, block);

// Replace all local getMeta closures
content = content.replace(/const getMeta = \(key: string\) => product\?\.meta_data\?\.find\(\(m: any\) => m\.key === key\)\?\.value;/g, 'const getMeta = getMetaValue;');

fs.writeFileSync(file, content);
