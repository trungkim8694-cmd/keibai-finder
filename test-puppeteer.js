const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Log all network requests
  page.on('request', request => {
    if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
      console.log('>>', request.method(), request.url());
    }
  });
  
  page.on('requestfailed', request => {
    console.log('FAILED:', request.url(), request.failure()?.errorText);
  });
  
  page.on('response', response => {
    if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
      console.log('<<', response.status(), response.url());
    }
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('https://www.keibai-koubai.com/', { waitUntil: 'networkidle2' });
  
  console.log('Page loaded. Clicking first link...');
  
  // Find the first "詳細を見る" button
  const link = await page.$('a[href^="/property/"]');
  if (link) {
    const href = await page.evaluate(el => el.getAttribute('href'), link);
    console.log('Found link:', href);
    await link.click();
    console.log('Clicked. Waiting 10s...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    const newUrl = page.url();
    console.log('New URL:', newUrl);
  } else {
    console.log('Link not found');
  }

  await browser.close();
})();
