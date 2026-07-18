const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000');
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
     const btns = document.querySelectorAll('button');
     for (let b of btns) {
       if (b.style.right === '40px') b.click();
     }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
     const btns = document.querySelectorAll('button');
     for (let b of btns) {
       if (b.style.left === '460px') b.click();
     }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
