const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();

    await page.goto('https://neoxscan.net/');

    const imgList = await page.evaluate(() => {
        //Função executada no navegador/browser

        //Pegando as imagens dos mangás
        const NodeList = document.querySelectorAll('div.page-listing-item img')
        //Transformando o NodeList em Array
        const imgArray = [...NodeList]
        //Trasformando os nodes (items) em objetos js
        const imgList = imgArray.map(({ src }) => ({
            src
        }))
        //Colocando para fora da função
        return imgList
    })

    //Escrevendo os dados em um arquivo local - json
    fs.writeFile('neox.json', JSON.stringify(imgList, null, 2), error => {
        if (error) throw new Error('algo deu errado!')

        console.log('tudo certo!')
    })

    await browser.close();
})();