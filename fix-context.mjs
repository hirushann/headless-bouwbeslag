import fs from 'fs';

const file = 'src/context/UserContext.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('isB2B: boolean;')) {
  content = content.replace(
    'isLoading: boolean;',
    'isB2B: boolean;\n  isLoading: boolean;'
  );
  content = content.replace(
    'isLoading: true,',
    'isB2B: false,\n  isLoading: true,'
  );
  content = content.replace(
    'const [isLoading, setIsLoading] = useState(true);',
    'const [isLoading, setIsLoading] = useState(true);\n  const [isB2B, setIsB2B] = useState(false);'
  );
  content = content.replace(
    'setUser(userData);',
    'setUser(userData);\n\n        // Set isB2B\n        const isB2BUser = (role && (role.includes("b2b_customer") || role.includes("administrator"))) || (userData && (userData.b2b_status === "approved" || (userData.meta_data && userData.meta_data.b2b_status === "approved")));\n        setIsB2B(!!isB2BUser);'
  );
  content = content.replace(
    'setUser(null);',
    'setUser(null);\n        setIsB2B(false);'
  );
  content = content.replace(
    'setUser(null);',
    'setUser(null);\n      setIsB2B(false);'
  );
  content = content.replace(
    'setUserRole(null);\n      setUser(null);',
    'setUserRole(null);\n      setUser(null);\n      setIsB2B(false);'
  );
  content = content.replace(
    'value={{ user, userRole, isLoading, refreshRole: fetchUserRole }}',
    'value={{ user, userRole, isB2B, isLoading, refreshRole: fetchUserRole }}'
  );

  fs.writeFileSync(file, content);
  console.log('Updated UserContext.tsx');
}
