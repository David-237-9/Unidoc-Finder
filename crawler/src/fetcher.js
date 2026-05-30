const DEFAULT_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 30000)
const DEFAULT_RETRIES = Number(process.env.FETCH_RETRIES || 2)
const USER_AGENT = process.env.USER_AGENT || "UnidocFinderCrawler/0.1.0"

/**
 * Waits for the requested number of milliseconds.
 * @param {number} ms The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetches a URL and returns its response body as text.
 * @param {string} url The URL to fetch.
 * @param {object} [options] Optional request settings.
 * @param {number} [options.timeoutMs] The request timeout in milliseconds.
 * @param {number} [options.retries] The number of retries after the first attempt.
 * @param {object} [options.headers] Extra HTTP headers to send.
 * @returns {Promise<string|null>} The response body, or null if all attempts fail.
 */
export async function fetchText(url, options = {}) {
    const {
        timeoutMs = DEFAULT_TIMEOUT_MS,
        retries = DEFAULT_RETRIES,
        headers = {}
    } = options

    let lastError = null

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    "User-Agent": USER_AGENT,
                    "Accept": "application/xml,text/xml,*/*;q=0.8",
                    ...headers
                }
            })

            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

            return await response.text()
        } catch (error) {
            lastError = error

            if (attempt < retries) {
                const waitMs = 1000 * (attempt + 1)
                console.warn(`Fetch failed (${attempt + 1}/${retries + 1}) for ${url}: ${error.message}. Retrying in ${waitMs}ms.`)
                await sleep(waitMs)
            }
        } finally {
            clearTimeout(timeout)
        }
    }

    console.warn(`Fetch failed permanently for ${url}: ${lastError?.message || "unknown error"}`)
    return null
}
