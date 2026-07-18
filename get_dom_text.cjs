const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    // Select the first car which is Pagani (since we patched it to the beginning)
    localStorage.setItem('ownedCarIds', JSON.stringify(['pagani']));
    localStorage.setItem('selectedOwnedCarIndex', '0');
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  
  // get the name of the selected car shown in the UI
  const carName = await page.evaluate(() => {
    // The active car name has a span saying ACTIVE next to it.
    const h4s = Array.from(document.querySelectorAll('h4'));
    const active = h4s.find(h => h.textContent.includes('ACTIVE'));
    return active ? active.textContent : "Not found";
  });
  
  console.log("Active car name:", carName);
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  
  await browser.close();
})();
