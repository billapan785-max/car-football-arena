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
  await new Promise(r => setTimeout(r, 6000));
  
  // Click PLAY button on splash screen
  try {
    const playBtn = await page.$('img[src="/playbutton.png"]');
    if (playBtn) {
      await playBtn.click();
      console.log("Clicked PLAY");
    }
  } catch (e) {
    console.log("Error clicking PLAY:", e);
  }
  
  await new Promise(r => setTimeout(r, 5000));
  
  const hasError = await page.evaluate(() => !!document.querySelector('vite-error-overlay'));
  console.log("Has Vite error overlay:", hasError);
  if (hasError) {
    const errorText = await page.evaluate(() => document.querySelector('vite-error-overlay').shadowRoot.innerHTML);
    console.log("VITE ERROR:", errorText);
  } else {
    // let's see if there's any active car
    const activeName = await page.evaluate(() => {
      const active = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('ACTIVE'));
      return active ? active.textContent : "None";
    });
    console.log("Active Car:", activeName);
  }
  
  await browser.close();
  process.exit(0);
})();
