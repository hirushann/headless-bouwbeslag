async function test() {
  const host = "https://ezearch.dayzsolutions.com";
  const key = "4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec";
  const index = "empire-bouwbeslag-products";
  
  const id = "8c0ba17f-d09a-478b-b6f2-e1132fa6a435";
  
  const res = await fetch(`${host}/indexes/${index}/documents/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }
  });
  console.log(res.status);
  console.log(await res.json());
}
test();
