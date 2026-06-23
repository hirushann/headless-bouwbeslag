async function test() {
  const host = "https://ezearch.dayzsolutions.com";
  const key = "4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec";
  const index = "empire-bouwbeslag-products";
  
  const res = await fetch(`${host}/indexes/${index}/settings`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}
test();
