import assert from "node:assert/strict";
import test from "node:test";

import { buildCategoryMembershipFilter } from "../src/lib/category-filter.ts";
import { buildMeilisearchPagination, resolveMeilisearchTotal } from "../src/lib/meilisearch-pagination.ts";

test("builds an exact category membership filter from the resolved category ID", () => {
  assert.equal(buildCategoryMembershipFilter(82), "category_id IN [82]");
  assert.equal(buildCategoryMembershipFilter([82, "123", 82]), "category_id IN [82, 123]");
  assert.throws(() => buildCategoryMembershipFilter("deurklink"), /valid category ID/);
});

test("uses finite pagination so filtered totals are exact", () => {
  assert.deepEqual(buildMeilisearchPagination(20, 40), { hitsPerPage: 20, page: 3 });
  assert.equal(resolveMeilisearchTotal({ totalHits: 45, estimatedTotalHits: 1000 }, 20), 45);
  assert.equal(resolveMeilisearchTotal({ estimatedTotalHits: 1000 }, 20), 1000);
});
