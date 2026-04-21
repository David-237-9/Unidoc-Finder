import * as cheerio from "cheerio"

export function extractData(page) {
    if (page.type === "pdf") {
        return {
            title: decodeURIComponent(page.url.split("/").pop()),
            fileUrl: page.url
        }
    }

    const $ = cheerio.load(page.html)

    // Detect DSpace (pt uni repos generally use this)
    const isDSpace = $('meta[name="DC.title"]').length > 0

    if (isDSpace) {
        const getMeta = (name) =>
            $(`meta[name="${name}"]`).attr("content") || null

        return {
            title: getMeta("DC.title"),
            authors: [getMeta("DC.creator")].filter(Boolean),
            abstract: getMeta("DC.description"),
            university: extractUniversityFromUrl(page.url),
            url: page.url,
            fileUrl: extractPdfLink($, page.url)
        }
    }

    // General
    return {
        title: $("title").text(),
        url: page.url
    }
}

function extractPdfLink($, baseUrl) {
    let pdf = null

    $("a[href]").each((_, el) => {
        const href = $(el).attr("href")

        if (href && href.toLowerCase().includes(".pdf")) {
            try {
                pdf = new URL(href, baseUrl).href
            } catch {}
        }
    })

    return pdf
}

function extractUniversityFromUrl(url) {
    try {
        const hostname = new URL(url).hostname

        // exemple: repo.isel.pt -> isel

        const parts = hostname.split(".")
        return parts.length > 2 ? parts[1] : parts[0]
    } catch {
        return null
    }
}
