export function buildCategoryMembershipFilter(categoryIds: number | string | Array<number | string>): string {
  const values = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
  const parsedIds = [...new Set(values.map(Number))];

  if (parsedIds.length === 0 || parsedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error("A valid category ID is required");
  }

  return `category_id IN [${parsedIds.join(", ")}]`;
}
