const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  
  const h4s = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h4')).map(h => h.textContent);
  });
  console.log("h4s:", h4s);
  
  await browser.close();
})();
