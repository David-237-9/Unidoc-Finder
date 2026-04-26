import * as cheerio from "cheerio"
import { createRequire } from "module" // Needed to import pdf-parse
const require = createRequire(import.meta.url)
const pdfParse = require("pdf-parse")

export async function extractData(page) {
    if (page.type === "pdf") {
        try {
            const data = await pdfParse(page.buffer)

            const text = data.text

            return {
                title: extractTitleFromText(text) || decodeURIComponent(page.url.split("/").pop()),
                abstract: extractAbstract(text),
                fileUrl: page.url,
                rawText: text.slice(0, 2000) // opcional (limita tamanho)
            }
        } catch (err) {
            console.log("PDF parse error:", page.url)
            return null
        }
    }

    const $ = cheerio.load(page.html)

    // Detect DSpace (pt uni repos generally use this)
    const isDSpace = $('meta[name="DC.title"]').length > 0

    if (isDSpace) {
        const getMeta = (name) =>
            $(`meta[name="${name}"]`).attr("content") || null

        const metadata = {
            title: getMeta("DC.title"),
            authors: [getMeta("DC.creator")].filter(Boolean),
            abstract: getMeta("DC.description"),
            university: extractUniversityFromUrl(page.url),
            url: page.url,
            fileUrl: extractPdfLink($, page.url)
        }

        // If we found a PDF link, try to fetch and parse it to enrich metadata
        if (metadata.fileUrl) {
            try {
                const res = await fetch(metadata.fileUrl)
                const buffer = Buffer.from(await res.arrayBuffer())

                const pdfData = await pdfParse(buffer)
                const text = pdfData.text

                // Extract abstract if empty
                if (!metadata.abstract) {
                    metadata.abstract = extractAbstract(text)
                }

                // Save partial text?
                metadata.rawText = text.slice(0, 2000)

            } catch (err) {
                console.log("Error enriching PDF:", metadata.fileUrl)
            }
        }

        console.log({
            title: metadata.title,
            hasAbstract: !!metadata.abstract,
            hasPdf: !!metadata.fileUrl
        })

        return metadata
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

function extractTitleFromText(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)

    // normalmente título está nas primeiras linhas
    return lines[0]?.length > 10 ? lines[0] : null
}

function extractAbstract(text) {
    const match = text.match(/abstract[:\s]+([\s\S]{100,1000})/i)
    return match ? match[1].trim() : null
}

export function extractLinks(html, baseUrl) {
    const $ = cheerio.load(html)
    const links = new Set()

    $("a[href]").each((_, el) => {
        const href = $(el).attr("href")
        if (!href) return

        try {
            const absolute = new URL(href, baseUrl).href

            // normalizar (remove trailing slash)
            const normalized = absolute.replace(/\/$/, "")

            links.add(normalized)
        } catch {
            // ignora URLs inválidas
        }
    })

    return Array.from(links)
}
