const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ownedCarIds', JSON.stringify(['pagani']));
    localStorage.setItem('selectedOwnedCarIndex', '0');
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  
  try {
    const playBtn = await page.$('img[src="/playbutton.png"]');
    if (playBtn) {
      await playBtn.click();
    }
  } catch (e) {}
  
  await new Promise(r => setTimeout(r, 5000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT:\n", text.substring(0, 500));
  
  await browser.close();
})();
