const fs = require('fs');

const file = 'src/actions/search.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace the Elasticsearch query
const oldQuery = `    if (query.trim()) {
        must.push({
            multi_match: {
                query: query,
                fields: ["post_title^3", "post_content", "meta.*.value", "meta._sku.value^2",],
                type: "bool_prefix"
            },
        });
    }`;

const newQuery = `    if (query.trim()) {
        must.push({
            bool: {
                should: [
                    {
                        multi_match: {
                            query: query,
                            fields: ["post_title^5", "meta._sku.value^5", "terms.product_brand.name^3", "terms.product_cat.name^2"],
                            type: "phrase_prefix"
                        }
                    },
                    {
                        multi_match: {
                            query: query,
                            fields: ["post_title^3", "post_content", "meta._sku.value^3"],
                            fuzziness: "AUTO"
                        }
                    }
                ],
                minimum_should_match: 1
            }
        });
    }`;

content = content.replace(oldQuery, newQuery);

// 2. Remove the fresh stock and media logic
// The block starts at `// 4. Fetch FRESH stock data` and ends just before `// Process Facets`
const startFetch = content.indexOf('// 4. Fetch FRESH stock data from WooCommerce');
const endFetch = content.indexOf('// Process Facets');

if (startFetch !== -1 && endFetch !== -1) {
    content = content.slice(0, startFetch) + content.slice(endFetch);
}

fs.writeFileSync(file, content);
