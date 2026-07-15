import fs from 'fs';

const file = 'src/components/ProductCard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace context destructuring
content = content.replace(
  'const { userRole: contextUserRole, isLoading } = useUserContext();',
  'const { userRole: contextUserRole, isLoading, isB2B: contextIsB2B } = useUserContext();'
);

// Replace isB2B definition
content = content.replace(
  'const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));',
  'const isB2B = propUserRole ? (propUserRole.includes("b2b_customer") || propUserRole.includes("administrator")) : contextIsB2B;'
);

fs.writeFileSync(file, content);
console.log('Updated ProductCard.tsx');
