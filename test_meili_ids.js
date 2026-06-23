async function test() {
  const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
  const data = await res.json();
  const prods = data.filterBaseProducts || [];
  console.log('Sample product keys:', Object.keys(prods[0]));
  console.log('Sample product id:', prods[0].id);
  console.log('Sample product product_id:', prods[0].product_id);
}
test();
