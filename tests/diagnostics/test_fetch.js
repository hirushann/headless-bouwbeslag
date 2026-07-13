fetch("https://ezearch.dayzsolutions.com/indexes/empire-bouwbeslag-products/search", {
    method: "POST",
    headers: {
        "Authorization": "Bearer 4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ filter: "slug = 'winlock_raamkruk_afsluitbaar_links_aluminium_f1_8_x_50'" })
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2)));
