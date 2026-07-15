async function test() {
    const res = await fetch('http://empire.test/api/sitemap/urls');
    const data = await res.json();
    console.log("Products:", data.products?.length);
    console.log("Categories:", data.categories?.length);
    console.log("Brands:", data.brands?.length);
    console.log("Blogs:", data.blogs?.length);
}
test();
