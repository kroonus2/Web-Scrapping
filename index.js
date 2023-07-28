const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Acessa a página de mangás
    await page.goto('https://neoxscan.net/manga/');
    await page.waitForSelector('div.wp-pagenavi');

    // Array para armazenar todos os links das páginas
    const allLinksPages = await page.$$eval('div.wp-pagenavi > a', element => element.map(link => link.href));

    // Pega cada link da div especificada e mapeia cada elemento em um objeto de links
    const links = await page.$$eval('div.item-thumb a', element => element.map(link => link.href));

    // Array para armazenar as informações de todos os mangás
    const mangaList = [];

    // Para cada link pego anteriormente, acessa sua página e extrai as informações
    let nextPageLink = 'https://neoxscan.net/manga/';
    while (nextPageLink != null) {
        await page.goto(nextPageLink);
        await page.waitForSelector('.wp-pagenavi');

        let testeLink;
        try {
            testeLink = await page.$eval('.nextpostslink', element => element.href);
        } catch (error) {
            testeLink = null; // Se não encontrar o link da próxima página, definimos como null para encerrar o ciclo
        }
        console.log(`link next page -> ${testeLink}`);

        for (const link of links) {
            await page.goto(link, {
                waitUntil: 'load',
                // Remove the timeout
                timeout: 0
            });
            await page.waitForSelector('div.post-title');
            // await page.setDefaultNavigationTimeout(0);

            const title = await page.$eval('div.post-title > h1', element => element.innerText);
            const image = await page.$eval('div.summary_image > a > img', element => element.src);
            const categories = await page.$$eval('div.genres-content > a', elements => elements.map(element => element.innerText));
            const type = await page.$$eval('div.post-content_item > div.summary-content', elements => elements.map(element => element.innerText));
            let description = "Sem descrição";
            try {
                description = await page.$eval('div.manga-excerpt > p', element => element.innerText);
            } catch (error) {
                console.log("Descrição não encontrada.");
            }
            const idChapter = await page.$$eval('div.listing-chapters_wrap > ul > li > a', elements => elements.map(element => element.innerText));
            const linkChapter = await page.$$eval('div.listing-chapters_wrap > ul > li > a', elements => elements.map(element => element.href));

            // Array para armazenar as informações de cada capítulo do mangá
            const chapters = [];

            // Para cada link de capítulo, acessa sua página e extrai as informações das páginas
            for (const link of linkChapter) {
                await page.goto(link);
                await page.waitForSelector('div.reading-content');
                await page.setDefaultNavigationTimeout(0);

                const capPagesId = await page.$$eval('div.page-break > img', elements => elements.map(element => element.id));
                const capPagesImgs = await page.$$eval('div.page-break > img', elements => elements.map(element => element.src));

                // Criando o objeto com as informações do capítulo
                const chapterInfo = {
                    id: idChapter[linkChapter.indexOf(link)],
                    link: link,
                    pages: capPagesId.map((pageId, index) => ({
                        id: pageId,
                        image: capPagesImgs[index],
                    })),
                };
                console.log(`manga -> ${title} - capitulo -> ${chapterInfo.id}`);
                console.log('Páginas:');
                chapterInfo.pages.map((page) => {
                    console.log(`- ${page.id}: ok`);
                });

                // Adicionando o chapterInfo ao array de chapters
                chapters.push(chapterInfo);
            }

            // Criando o objeto com as informações do mangá e o array de chapters com as informações dos capítulos
            const mangaInfo = { title, image, categories, description, type, chapters };

            // Adicionando o mangaInfo ao array de mangás
            mangaList.push(mangaInfo);
        }

        nextPageLink = testeLink;

    }


    // Escrevendo o array de mangás em um arquivo JSON
    fs.writeFile('mangaList.json', JSON.stringify(mangaList, null, 2), error => {
        if (error) throw new Error('algo deu errado!')

        console.log('tudo certo! O arquivo mangaList.json foi criado com sucesso.');
    });

    await browser.close();
})();
