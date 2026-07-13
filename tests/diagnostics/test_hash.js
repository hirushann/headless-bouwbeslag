function termSlugToId(attrId, slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffff;
  }
  return attrId * 10000 + (hash % 9000 + 1);
}
console.log("zwart:", termSlugToId(9002, "zwart"));
console.log("wit:", termSlugToId(9002, "wit"));
