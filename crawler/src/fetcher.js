export async function fetchPage(url) {
    const res = await fetch(url, {
        headers: {
            "User-Agent": "UnidocFinderCrawler/1.0"
        }
    })

    if (!res.ok) { // HTTP error
        console.log("HTTP error " + res.status + " for " + url)
        return null
    }

    const contentType = res.headers.get("content-type")

    if (contentType.includes("application/pdf")) {
        return {
            type: "pdf",
            url
        }
    }

    return {
        type: "html",
        html: await res.text(),
        url
    }
}
