const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ownedCarIds', JSON.stringify(['pagani']));
    localStorage.setItem('selectedOwnedCarIndex', '0');
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 10000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log("Body text includes PAGANI ZONDA:", text.includes('PAGANI ZONDA'));
  console.log("Body text includes LOBBY:", text.includes('LOBBY'));
  
  await browser.close();
})();
