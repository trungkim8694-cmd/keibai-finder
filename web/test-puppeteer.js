const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Listen to console and network
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('response', response => {
    if (response.url().includes('localhost')) {
      console.log('NETWORK:', response.url(), response.status());
    }
  });

  await page.goto('http://localhost:3000');
  await page.waitForSelector('text/マンション', { timeout: 10000 });
  console.log("Found Mansion button!");
  
  // Click mansion button
  const buttons = await page.$$('button');
  for (const b of buttons) {
     const text = await page.evaluate(el => el.textContent, b);
     if (text.includes('マンション')) {
         await b.click();
         console.log("Clicked Mansion button!");
         break;
     }
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Click search button
  for (const b of buttons) {
     const text = await page.evaluate(el => el.textContent, b);
     if (text.includes('検索')) {
         await b.click();
         console.log("Clicked Search button!");
         break;
     }
  }

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
  console.log("Done");
})();
