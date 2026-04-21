import { addUrl, getNextUrl, markVisited, hasUrls } from "./queue.js"
import { fetchPage } from "./fetcher.js"
import { extractData } from "./parser.js"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // test only, remove later, allows crawling sites with invalid SSL certificates

const seenDocs = new Set()

const delay = ms => new Promise(res => setTimeout(res, ms))

addUrl("https://repositorio.ipl.pt/browse/dateissued")

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

        if (data && !isDuplicate(data)) {
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
crawl() // start crawler

function isDuplicate(data) {
    const key = data.fileUrl || data.url
    if (!key) return true

    if (seenDocs.has(key)) return true

    seenDocs.add(key)
    return false
}
