const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3001/categorie/raamkruk');
  
  // Wait for the Kleur accordion to be available and click it
  await page.waitForSelector('text=Kleur', { timeout: 10000 });
  
  // Click on Kleur to open the accordion
  const kleurElement = await page.$('text=Kleur');
  if (kleurElement) {
    await kleurElement.click();
    console.log("Clicked Kleur");
  } else {
    console.log("Could not find Kleur");
  }

  // Wait a bit for the animation
  await page.waitForTimeout(500);

  // Click on Zwart
  const zwartElement = await page.$('text=Zwart');
  if (zwartElement) {
    await zwartElement.click();
    console.log("Clicked Zwart");
  } else {
    console.log("Could not find Zwart");
  }
  
  // Wait for React to update
  await page.waitForTimeout(1000);
  
  try {
    const debugText = await page.innerText('.font-mono', { timeout: 2000 });
    console.log("DEBUG OUTPUT:");
    console.log(debugText);
  } catch (e) {
    console.log("No debug text found. Products might be showing.");
    const products = await page.$$('.grid > div');
    console.log(`Found ${products.length} products showing in the grid.`);
  }

  await browser.close();
})();
