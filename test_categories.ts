async function test() {
    const res = await fetch('http://empire.test/api/categories');
    const data = await res.json();
    console.log(JSON.stringify(data[0], null, 2));
}
test();
