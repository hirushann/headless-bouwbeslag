
const api = require('./src/lib/woocommerce').default;

async function checkHierarchy() {
  const slugs = ['deurklink', 'cilinders', 'tochtstrip', 'deurstoppers', 'deurbeslag'];
  
  for (const slug of slugs) {
    try {
      const res = await api.get("products/categories", { slug });
      if (res.data && res.data.length > 0) {
        const cat = res.data[0];
        console.log(`Slug: ${slug} | ID: ${cat.id} | Parent: ${cat.parent}`);
        if (cat.parent !== 0) {
            // fetch parent info
            const parentRes = await api.get(`products/categories/${cat.parent}`);
            console.log(`   -> Parent Slug: ${parentRes.data.slug}`);
        }
      } else {
        console.log(`Slug: ${slug} | Not Found`);
      }
    } catch (e) {
      console.error(`Error checking ${slug}:`, e.message);
    }
  }
}

checkHierarchy();
