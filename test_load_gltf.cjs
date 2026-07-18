const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    console.log("Starting manual load test...");
    return new Promise((resolve) => {
      // Assuming THREE and GLTFLoader are somehow accessible, but let's just fetch it
      fetch('/paganizondacinque.glb')
        .then(res => res.arrayBuffer())
        .then(buffer => {
           console.log("Fetched GLB, size:", buffer.byteLength);
           resolve();
        })
        .catch(err => {
           console.log("Fetch error:", err.message);
           resolve();
        });
    });
  });
  
  await browser.close();
})();
