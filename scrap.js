const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Função para extrair links de cada página
    async function extractPageLinks() {
        const links = await page.$$eval('div.item-thumb a', element => element.map(link => link.href));
        return links;
    }

    // Função para extrair informações de cada mangá
    async function extractMangaInfo(page, link) {
        await page.goto(link);
        await page.waitForSelector('div.post-title');
        page.setDefaultNavigationTimeout(0);

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

        const chapters = [];
        for (const linkCap of linkChapter) {
            await page.goto(linkCap);
            await page.waitForSelector('div.reading-content');
            page.setDefaultNavigationTimeout(0);

            const capPagesId = await page.$$eval('div.page-break > img', elements => elements.map(element => element.id));
            const capPagesImgs = await page.$$eval('div.page-break > img', elements => elements.map(element => element.src));

            const chapterInfo = {
                id: idChapter[linkChapter.indexOf(linkCap)],
                link: linkCap,
                pages: capPagesId.map((pageId, index) => ({
                    id: pageId,
                    image: capPagesImgs[index],
                })),
            };

            console.log(`manga -> ${title} - capitulo -> ${chapterInfo.id}`);
            // console.log('Páginas:');
            // chapterInfo.pages.map((page) => {
            //     console.log(`- ${page.id}: ok`);
            // });

            chapters.push(chapterInfo);
        }

        return { title, image, categories, description, type, chapters };
    }

    // Array para armazenar as informações de todos os mangás
    const mangaList = [];


    // Enquanto houver links de próxima página
    let nextPageLink = 'https://neoxscan.net/manga/';
    while (nextPageLink != null) {
        await page.goto(nextPageLink);
        await page.waitForSelector('.wp-pagenavi');
        page.setDefaultNavigationTimeout(0);

        let testeLink;
        try {
            testeLink = await page.$eval('.nextpostslink', element => element.href);
        } catch (error) {
            testeLink = null; // Se não encontrar o link da próxima página, definimos como null para encerrar o ciclo
        }
        console.log(`link next page -> ${testeLink}`);

        const links = await extractPageLinks();

        // Para cada link pego anteriormente, extrai as informações do mangá
        for (const link of links) {
            const mangaInfo = await extractMangaInfo(page, link);
            // mangaInfo.chapters = await extractChapterInfo(page, link);
            mangaList.push(mangaInfo);
            // console.log(`Manga -> ${mangaInfo.title}`);
        }

        nextPageLink = testeLink;
    }

    // Escrevendo o array de mangás em um arquivo JSON
    fs.writeFile('mangaList.json', JSON.stringify(mangaList, null, 2), error => {
        if (error) throw new Error('Algo deu errado!')

        console.log('Tudo certo! O arquivo mangaList.json foi criado com sucesso.');
    });

    await browser.close();
})();
