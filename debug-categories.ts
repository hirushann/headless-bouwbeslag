import { WooCommerceClient } from "./src/lib/woocommerce";

const WP_API_URL = "https://app.bouwbeslag.nl";
const CK = "ck_13140f6a16a11f40eb1e260c502c1130e2991d5c";
const CS = "cs_bf4bccddc249fa39860284d7583e0df91cf32d8a";

const api = new WooCommerceClient({
  url: WP_API_URL,
  consumerKey: CK,
  consumerSecret: CS,
  version: "wc/v3",
});

async function debugCategories() {
  try {
    console.log("Fetching ALL categories...");
    let page = 1;
    let allCats: any[] = [];
    
    while(true) {
        const res = await api.get("products/categories", { per_page: 100, page });
        const data = res.data;
        if(!data || data.length === 0) break;
        allCats = [...allCats, ...data];
        page++;
    }
    
    // Map for parent lookup
    const catMap = new Map();
    allCats.forEach((c: any) => catMap.set(c.id, c));

    const getPath = (id: number) => {
        let path = "";
        let curr = id;
        while(curr !== 0 && catMap.has(curr)){
            const c = catMap.get(curr);
            path = path ? `${c.slug}/${path}` : c.slug;
            curr = c.parent;
        }
        return path;
    };

    const target = allCats.find((c: any) => c.slug === 'rvs-deurklinken');
    if (target) {
        console.log("Full path for 'rvs-deurklinken' (ID 44?):", getPath(target.id));
    }
    
    const deurklinken = allCats.find((c: any) => c.slug === 'deurklinken');
    console.log("Slug 'deurklinken' exists?", !!deurklinken);

    const deurbeslag = allCats.find((c: any) => c.slug === 'deurbeslag');
    console.log("Slug 'deurbeslag' exists?", !!deurbeslag);
    
    // Check Brands
    console.log("Fetching Brands...");
    // Need to use the generic 'get' as brands are usually at wp/v2/product_brand if standard taxonomy or custom
    try {
       const resB = await api.get("wp/v2/product_brand", { per_page: 100 });
       const brands = resB.data;
       console.log(`Fetched ${brands.length} brands.`);
       if(brands.length > 0) {
           console.log("Sample Brand:", { name: brands[0].name, slug: brands[0].slug });
       }
    } catch(e) { console.log("Failed to fetch brands via WC client (might need different endpoint)", e.message); }

  } catch (err) {
    console.error("Error:", err);
  }
}

debugCategories();
