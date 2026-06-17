const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.text().includes('[FilterSidebar]')) {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  await page.goto('http://localhost:3000/bouwbeslag-groothandel/raamkruk', { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
