const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.toString()));
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ownedCarIds', JSON.stringify(['pagani']));
    localStorage.setItem('selectedOwnedCarIndex', '0');
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait for 10 seconds to bypass splash screen (7s) + 3s buffer
  await new Promise(r => setTimeout(r, 10000));
  
  const activeName = await page.evaluate(() => {
    const active = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('ACTIVE'));
    return active ? active.textContent : "None";
  });
  console.log("Active Car:", activeName);
  
  await browser.close();
})();
