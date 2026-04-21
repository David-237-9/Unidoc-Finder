import { addUrl, getNextUrl, markVisited, hasUrls } from "./queue.js"
import { fetchPage } from "./fetcher.js"
import { extractLinks } from "./parser.js"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // test only, remove later, allows crawling sites with invalid SSL certificates

const delay = ms => new Promise(res => setTimeout(res, ms))

addUrl("https://example.com")

import { extractData } from "./parser.js"

async function crawl() {
    while (hasUrls()) {
        const url = getNextUrl()
        if (!url) continue

        console.log("Crawling:", url)

        const page = await fetchPage(url)
        if (!page) continue

        markVisited(url)

        // extract data
        const data = extractData(page)

        if (data) {
            console.log("DATA:", data)
            // save to postgres here
        }

        // only extract html
        if (page.type === "html") {
            const links = extractLinks(page.html, url)
            for (const link of links) {
                addUrl(link)
            }
        }
    }

    console.log('End of crawling')
}

crawl()
