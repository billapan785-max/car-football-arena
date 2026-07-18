const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ownedCarIds', JSON.stringify(['pagani']));
    localStorage.setItem('selectedOwnedCarIndex', '0');
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click anywhere to dismiss splash
  await page.mouse.click(100, 100);
  await new Promise(r => setTimeout(r, 4000)); // Wait for lobby
  
  const html = await page.content();
  console.log("HTML length:", html.length);
  
  const activeName = await page.evaluate(() => {
    const active = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('ACTIVE'));
    return active ? active.textContent : "None";
  });
  console.log("Active Car:", activeName);
  
  // Let's also grab console logs
  
  await browser.close();
})();
