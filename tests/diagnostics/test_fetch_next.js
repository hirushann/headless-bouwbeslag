const { mapMeiliToWooProduct } = require('../../src/lib/meilisearch-products');

fetch("https://ezearch.dayzsolutions.com/indexes/empire-bouwbeslag-products/search", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${process.env.MEILISEARCH_KEY || ""}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ filter: ["slug = 'winlock_raamkruk_afsluitbaar_links_aluminium_f1_8_x_50'"] })
}).then(res => res.json()).then(data => {
    console.log(data);
});
