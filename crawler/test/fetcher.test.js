import assert from "node:assert/strict"
import { describe, it, beforeEach, afterEach } from "mocha"
import { fetchText } from "../src/fetcher.js"

const originalFetch = globalThis.fetch
const originalWarn = console.warn

let warnings

describe("fetchText", () => {
    beforeEach(() => {
        warnings = []
        console.warn = (...args) => warnings.push(args.join(" "))
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
        console.warn = originalWarn
    })

    it("returns response text and sends crawler-friendly headers", async () => {
        let requestedUrl
        let requestedOptions

        globalThis.fetch = async (url, options) => {
            requestedUrl = url
            requestedOptions = options

            return {
                ok: true,
                async text() {
                    return "<xml>ok</xml>"
                }
            }
        }

        const body = await fetchText("https://repo.example/oai", {
            retries: 0,
            timeoutMs: 1000,
            headers: { "X-Test": "yes" }
        })

        assert.equal(body, "<xml>ok</xml>")
        assert.equal(requestedUrl, "https://repo.example/oai")
        assert.equal(requestedOptions.headers["User-Agent"], "UnidocFinderCrawler/0.1.0")
        assert.equal(requestedOptions.headers.Accept, "application/xml,text/xml,*/*;q=0.8")
        assert.equal(requestedOptions.headers["X-Test"], "yes")
        assert.ok(requestedOptions.signal instanceof AbortSignal)
        assert.deepEqual(warnings, [])
    })

    it("returns null and warns when the server responds with a non-success status", async () => {
        globalThis.fetch = async () => ({
            ok: false,
            status: 503,
            statusText: "Service Unavailable",
            async text() {
                return "unavailable"
            }
        })

        const body = await fetchText("https://repo.example/oai", { retries: 0, timeoutMs: 1000 })

        assert.equal(body, null)
        assert.equal(warnings.length, 1)
        assert.match(warnings[0], /Fetch failed permanently/)
        assert.match(warnings[0], /HTTP 503 Service Unavailable/)
    })

    it("retries transient failures and returns the successful response", async function () {
        this.timeout(3000)

        let attempts = 0
        globalThis.fetch = async () => {
            attempts++
            if (attempts === 1) throw new Error("temporary network failure")

            return {
                ok: true,
                async text() {
                    return "eventual success"
                }
            }
        }

        const body = await fetchText("https://repo.example/oai", { retries: 1, timeoutMs: 1000 })

        assert.equal(body, "eventual success")
        assert.equal(attempts, 2)
        assert.equal(warnings.length, 1)
        assert.match(warnings[0], /Retrying in 1000ms/)
        assert.match(warnings[0], /temporary network failure/)
    })
})
