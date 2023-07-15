const puppeteer = require('puppeteer');
const fs = require('fs');
let p = 1;

(async () => {
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();

    //Acessa a pagina de mangás
    await page.goto('https://neoxscan.net/manga/');

    //Pega cada link da div especificada e mapea cada elemento em um objeto de links
    const links = await page.$$eval('div.item-thumb a', element => element.map(link => link.href));

    //Para cada link pego anteriormente, acessa sua pagina e extrai o titulo e incrementa a pagina 
    for (const link of links) {
        await page.goto(link);
        await page.waitForSelector('div.post-title');

        const title = await page.$eval('div.post-title > h1', element => element.innerText);

        const obj = { p, title };
        console.log(`pagina -> ${obj.p}, titulo -> ${obj.title}`);

        p++;
    }

    await browser.close();
})();