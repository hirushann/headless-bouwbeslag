const MEILISEARCH_HOST = "https://ezearch.dayzsolutions.com";
const MEILISEARCH_KEY = "4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec";
const MEILISEARCH_PRODUCTS_INDEX = "empire-bouwbeslag-products";

async function fetchMeiliProducts(limit = 10, offset = 0, query = "", filters = []) {
    const body = { q: query, limit, offset };
    if (filters && filters.length > 0) body.filter = filters;
    const res = await fetch(`${MEILISEARCH_HOST}/indexes/${MEILISEARCH_PRODUCTS_INDEX}/search`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${MEILISEARCH_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        console.error("Failed:", await res.text());
    } else {
        console.log("Success:", await res.json());
    }
}
fetchMeiliProducts(1, 0, "", [`slug = 'raamkruk'`]);
