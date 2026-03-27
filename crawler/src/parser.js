import * as cheerio from "cheerio"
import { URL } from "url"

export function extractLinks(html, baseUrl) {
    const $ = cheerio.load(html)
    const links = []

    $("a[href]").each((_, el) => {
        const href = $(el).attr("href")

        try {
            const absolute = new URL(href, baseUrl).href
            links.push(absolute)
        } catch {}
    })

    return links
}
