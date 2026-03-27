import { addUrl, getNextUrl, markVisited, hasUrls } from "./queue.js"
import { fetchPage } from "./fetcher.js"
import { extractLinks } from "./parser.js"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // test only, remove later, allows crawling sites with invalid SSL certificates

const delay = ms => new Promise(res => setTimeout(res, ms))

addUrl("https://example.com")

async function crawl() {
    while (hasUrls()) {
        const url = getNextUrl()

        if (!url) continue

        console.log("Crawling:", url)

        const html = await fetchPage(url)

        if (!html) continue;

        markVisited(url)

        const links = extractLinks(html, url)

        for (const link of links) {
            addUrl(link)
        }

        // await delay(1000) // Delay between requests
    }

    console.log('End of crawling')
}

crawl()
