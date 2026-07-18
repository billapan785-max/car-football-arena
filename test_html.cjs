const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ownedCarIds', JSON.stringify(['lunchbox', 'pagani']));
    localStorage.setItem('selectedOwnedCarIndex', '1');
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  
  const html = await page.content();
  console.log("HTML length:", html.length);
  if (html.length < 1000) console.log(html);
  
  // also check if there is an error overlay from Vite
  const hasError = await page.evaluate(() => !!document.querySelector('vite-error-overlay'));
  console.log("Has Vite error overlay:", hasError);
  
  await browser.close();
})();
