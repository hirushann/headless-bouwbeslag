const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Go to the category page
  await page.goto('http://localhost:3001/categorie/raamkruk');
  
  // Wait for products to load
  await page.waitForSelector('.grid');
  
  // Find the Zwart checkbox and click it
  // Wait for the filter sidebar to render
  await page.waitForSelector('text=Zwart');
  
  // Click the checkbox next to Zwart
  await page.click('text=Zwart');
  
  // Wait a bit for React to update
  await page.waitForTimeout(1000);
  
  // Read the debug text
  try {
    const debugText = await page.innerText('.font-mono');
    console.log("DEBUG OUTPUT:");
    console.log(debugText);
  } catch (e) {
    console.log("No debug text found. Products might be showing.");
    
    // Count products
    const products = await page.$$('.grid > div');
    console.log(`Found ${products.length} products showing in the grid.`);
  }

  await browser.close();
})();
