const fs = require('fs');
const file = 'src/app/[...slug]/ProductPageClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// remove the existing definition
const blockStart = content.indexOf('const productMetaMap = React.useMemo(');
const blockEnd = content.indexOf('}, [productMetaMap]);') + '}, [productMetaMap]);'.length;
const block = content.slice(blockStart, blockEnd);

content = content.replace(block, '');

// insert it right before getMeta
content = content.replace('const getMeta = getMetaValue;', block + '\n\n  const getMeta = getMetaValue;');

fs.writeFileSync(file, content);
