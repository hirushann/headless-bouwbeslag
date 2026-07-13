const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/winlock_raamkruk_afsluitbaar_links_aluminium_f1_8_x_50');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'artifacts/debug/screenshot.png' });
  await browser.close();
})();
