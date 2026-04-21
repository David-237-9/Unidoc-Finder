import * as cheerio from "cheerio"

export function extractData(page) {
    if (page.type === "pdf") {
        return {
            title: page.url.split("/").pop(),
            fileUrl: page.url
        }
    }

    const $ = cheerio.load(page.html)

    const title = $("title").text()

    // basic try
    const description = $('meta[name="description"]').attr("content")

    return {
        title,
        abstract: description || null,
        url: page.url
    }
}
