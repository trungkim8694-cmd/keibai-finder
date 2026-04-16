import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/') && response.request().method() === 'POST') {
       console.log('NETWORK POST:', url, response.status());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  console.log("Navigated to page");
  
  await new Promise(r => setTimeout(r, 2000)); // wait for map
  
  // Try to click "土地"
  try {
      const b = await page.$x("//button[contains(., '土地')]");
      if (b.length > 0) { await b[0].click(); console.log("Clicked 土地!"); }
  } catch(e) {}
  
  await new Promise(r => setTimeout(r, 500));
  
  // Try to click "検索"
  try {
      const b2 = await page.$x("//button[contains(., '検索')]");
      if (b2.length > 0) { await b2[0].click(); console.log("Clicked 検索!"); }
  } catch(e) {}

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
