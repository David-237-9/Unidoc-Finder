import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"
import { fetchText } from "./fetcher.js"
import { parseOaiRecords, isThesis, matchesFilter, resultKey } from "./parser.js"
import { REPOSITORIES } from "./repositories.js"

applyCliEnvironmentOverrides()

if (process.env.ALLOW_INVALID_TLS === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
    console.log("WARNING: ALLOW_INVALID_TLS is enabled. TLS certificate errors will be ignored!")
}

const selectedRepositories = getSelectedRepositories()
const optionalBuildFilter = getOptionalFilter()
const crawlDelayMs = Number(process.env.CRAWL_DELAY_MS || 250)
const maxRecordsPerRepository = Number(process.env.MAX_RECORDS_PER_REPO || 0)
const maxDocuments = Number(process.env.MAX_DOCUMENTS || 0)
const progressEvery = Number(process.env.PROGRESS_EVERY || 5000)
const maxDescriptionChars = Number(process.env.MAX_DESCRIPTION_CHARS || 2000)
const outputDir = process.env.INDEX_DIR || "data"
const apiUrl = process.env.THESIS_API_URL || "http://localhost:8080/api/thesis"

// Output destination modes:
const OUTPUT_DESTINATION_API_ONLY = 1
const OUTPUT_DESTINATION_DOCUMENTS_JSONL_ONLY = 2
const OUTPUT_DESTINATION_BOTH = 3
const outputDestination = Number(process.env.OUTPUT_DESTINATION || OUTPUT_DESTINATION_API_ONLY)

validateOutputDestination(outputDestination)

const shouldSendToApi = outputDestination === OUTPUT_DESTINATION_API_ONLY || outputDestination === OUTPUT_DESTINATION_BOTH
const shouldSaveToDocumentsJsonl = outputDestination === OUTPUT_DESTINATION_DOCUMENTS_JSONL_ONLY || outputDestination === OUTPUT_DESTINATION_BOTH
const seenDocumentHashes = new Set()
let documentCount = 0

/**
 * Runs the complete crawl process.
 * @returns {Promise<void>} A promise that resolves when all selected repositories have been processed.
 */
async function main() {
    const started = Date.now()
    const documentsPath = path.join(outputDir, "documents.jsonl")

    console.log("Crawling thesis/dissertation records.")
    console.log(`Repositories: ${selectedRepositories.map(repository => repository.id).join(", ")}`)
    console.log(`Destination mode: ${describeOutputDestination(outputDestination)}`)

    if (shouldSendToApi) console.log(`API: ${apiUrl}`)
    if (shouldSaveToDocumentsJsonl) {
        console.log(`Documents JSONL: ${documentsPath}`)
    }

    if (optionalBuildFilter) {
        console.log(`Build filter: "${optionalBuildFilter}"`)
        console.log("Only matching documents will be processed.")
    }

    console.log("") // ESmpty line for better readability

    let documentStream = null

    if (shouldSaveToDocumentsJsonl) {
        await fsp.rm(outputDir, { recursive: true, force: true })
        await fsp.mkdir(outputDir, { recursive: true })
        documentStream = fs.createWriteStream(documentsPath, { encoding: "utf8" })
    }

    try {
        for (const repository of selectedRepositories) {
            if (maxDocuments > 0 && documentCount >= maxDocuments) break
            await crawlRepository(repository, documentStream)
        }
    } finally {
        if (documentStream) await closeWriteStream(documentStream)
    }

    const elapsed = ((Date.now() - started) / 1000).toFixed(1)

    console.log("\n" + "=".repeat(90))
    console.log(`Crawl completed in ${elapsed}s.`)
    console.log(`Processed documents: ${documentCount}`)

    if (shouldSendToApi) console.log(`Sent to API: ${documentCount}`)
    if (shouldSaveToDocumentsJsonl) console.log(`Saved file: ${documentsPath}`)
}

/**
 * Crawls one OAI-PMH repository and processes matching thesis records.
 * @param {object} repository The repository configuration.
 * @param {string} repository.id The repository identifier.
 * @param {string} repository.name The repository display name.
 * @param {string} repository.repoUrl The repository OAI-PMH endpoint.
 * @param {fs.WriteStream|null} documentStream The stream where JSONL documents are written, or null when JSONL output is disabled.
 * @returns {Promise<void>} A promise that resolves when the repository has been processed.
 */
async function crawlRepository(repository, documentStream) {
    let nextUrl = buildListRecordsUrl(repository.repoUrl)
    let processed = 0
    let kept = 0
    let page = 1

    console.log(`=== ${repository.name} (${repository.id}) ===`)

    while (nextUrl) {
        if (maxDocuments > 0 && documentCount >= maxDocuments) return

        if (maxRecordsPerRepository > 0 && processed >= maxRecordsPerRepository) {
            console.log(`MAX_RECORDS_PER_REPO reached for ${repository.id}: ${processed}`)
            return
        }

        const xml = await fetchText(nextUrl)
        if (!xml) return

        const { records, resumptionToken, oaiError } = parseOaiRecords(xml, repository)

        if (oaiError) {
            console.warn(`OAI error for ${repository.id}: ${oaiError.code}${oaiError.message ? ` - ${oaiError.message}` : ""}`)
            return
        }

        if (records.length === 0) {
            console.warn(`No OAI records found for ${repository.id} on page ${page}. Check the endpoint URL and metadataPrefix.`)
            return
        }

        for (const record of records) {
            processed++

            if (maxRecordsPerRepository > 0 && processed > maxRecordsPerRepository) break
            if (!isThesis(record)) continue
            if (optionalBuildFilter && !matchesFilter(record, optionalBuildFilter)) continue
            if (isDuplicate(record)) continue

            const document = prepareDocument(record)

            if (shouldSendToApi) await sendDocumentToApi(document, repository)
            if (shouldSaveToDocumentsJsonl) await saveDocumentToJsonl(documentStream, document)

            documentCount++
            kept++

            if (maxDocuments > 0 && documentCount >= maxDocuments) break
        }

        if (shouldPrintProgress(processed, records.length)) {
            printProgress(page, processed, kept)
        }

        nextUrl = resumptionToken ? buildResumptionUrl(repository.repoUrl, resumptionToken) : null
        page++

        if (nextUrl && crawlDelayMs > 0) await delay(crawlDelayMs)
    }

    console.log(`Finished ${repository.id}. Processed: ${processed}; kept: ${kept}; total: ${documentCount}\n`)
}

/**
 * Creates the final stored document object and trims very large fields.
 * @param {object} record The parsed thesis metadata record.
 * @returns {object} The compact document stored in the JSONL file.
 */
function prepareDocument(record) {
    return {
        repository: record.repository,
        university: record.university,
        title: record.title || null,
        authors: record.authors || [],
        description: truncateText(record.description, maxDescriptionChars),
        year: record.year || null,
        subjects: record.subjects || [],
        type: record.type || [],
        language: record.language || null,
        url: record.url || null,
        fileUrl: record.fileUrl || null,
        oaiIdentifier: record.oaiIdentifier || null,
        datestamp: record.datestamp || null,
        hash: hashText(resultKey(record))
    }
}

/**
 * Saves one document to the JSONL output file.
 * @param {fs.WriteStream|null} documentStream The JSONL output stream.
 * @param {object} document The compact document to save.
 * @returns {Promise<void>} A promise that resolves when the document has been written.
 */
async function saveDocumentToJsonl(documentStream, document) {
    if (!documentStream) throw new Error("documents.jsonl output is enabled, but the output stream is not available.")
    await writeToStream(documentStream, JSON.stringify(document) + "\n")
}

/**
 * Sends one document to the thesis API and waits for the API response.
 * First checks whether the document hash already exists in the API to avoid duplicates.
 * @param {object} document The compact document stored in the JSONL file.
 * @param {object} repository The repository configuration.
 * @returns {Promise<void>} A promise that resolves when the document has been accepted.
 */
async function sendDocumentToApi(document, repository) {
    const payload = createDocumentRequest(document, repository)

    if (await thesisExists(payload.hash)) return

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const responseBody = await response.text().catch(() => "")
        throw new Error(`Failed to save document "${payload.title}" (${response.status} ${response.statusText}): ${responseBody}`)
    }
}

/**
 * Checks whether a thesis with the given hash already exists in the API.
 * @param {string} hash The document hash.
 * @returns {Promise<boolean>} True when the thesis already exists.
 */
async function thesisExists(hash) {
    const existsUrl = new URL(`${apiUrl.replace(/\/$/, "")}/exists`)
    existsUrl.searchParams.set("hash", hash)

    const response = await fetch(existsUrl, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    })

    if (!response.ok) {
        const responseBody = await response.text().catch(() => "")
        throw new Error(`Failed to check document hash (${response.status} ${response.statusText}): ${responseBody}`)
    }

    return response.json()
}

/**
 * Converts a stored document into the request expected by the thesis API.
 * @param {object} document The compact document stored in the JSONL file.
 * @param {object} repository The repository configuration.
 * @returns {object} The thesis API request body.
 */
function createDocumentRequest(document, repository) {
    if (!repository.id) throw new Error(`Missing universityId for repository ${repository.name}`)

    return {
        title: document.title || "Untitled",
        abstract: document.description || "",
        year: parseYear(document.year),
        url: document.url || document.fileUrl || "",
        authors: document.authors || [],
        subjects: document.subjects || [],
        type: Array.isArray(document.type) ? document.type.join(", ") : String(document.type || ""),
        language: document.language || "",
        fileUrl: document.fileUrl || null,
        universityId: repository.id,
        hash: document.hash
    }
}

/**
 * Converts a parsed year into the integer expected by the thesis API.
 * @param {string|number|null|undefined} value The parsed year value.
 * @returns {number} The integer year, or 0 when no year is available.
 */
function parseYear(value) {
    const year = Number.parseInt(value, 10)
    return Number.isInteger(year) ? year : 0
}

/**
 * Validates the configured output destination.
 * @param {number} value The configured output destination value.
 * @returns {void}
 */
function validateOutputDestination(value) {
    const validDestinations = [
        OUTPUT_DESTINATION_API_ONLY,
        OUTPUT_DESTINATION_DOCUMENTS_JSONL_ONLY,
        OUTPUT_DESTINATION_BOTH
    ]

    if (!validDestinations.includes(value)) {
        throw new Error(`Invalid OUTPUT_DESTINATION "${value}". Use 1 for API only, 2 for documents.jsonl only, or 3 for both.`)
    }
}

/**
 * Returns a human-readable label for an output destination.
 * @param {number} value The configured output destination value.
 * @returns {string} The output destination label.
 */
function describeOutputDestination(value) {
    if (value === OUTPUT_DESTINATION_API_ONLY) return "1 - only send to API"
    if (value === OUTPUT_DESTINATION_DOCUMENTS_JSONL_ONLY) return "2 - only save to documents.jsonl"
    return "3 - send to API and save to documents.jsonl"
}

/**
 * Writes text to a stream and waits when the stream applies backpressure.
 * @param {fs.WriteStream} stream The stream to write to.
 * @param {string} text The text to write.
 * @returns {Promise<void>} A promise that resolves when the text has been accepted by the stream.
 */
function writeToStream(stream, text) {
    return new Promise((resolve, reject) => {
        const onError = error => reject(error)
        stream.once("error", onError)

        const done = () => {
            stream.off("error", onError)
            resolve()
        }

        if (stream.write(text)) done()
        else stream.once("drain", done)
    })
}

/**
 * Closes a writable stream safely.
 * @param {fs.WriteStream} stream The stream to close.
 * @returns {Promise<void>} A promise that resolves when the stream has closed.
 */
function closeWriteStream(stream) {
    return new Promise((resolve, reject) => {
        stream.once("error", reject)
        stream.end(resolve)
    })
}

/**
 * Waits for the requested number of milliseconds.
 * @param {number} ms The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Builds the initial OAI-PMH ListRecords URL.
 * @param {string} repoUrl The repository OAI-PMH endpoint.
 * @returns {string} The ListRecords URL.
 */
function buildListRecordsUrl(repoUrl) {
    const url = new URL(repoUrl)
    url.searchParams.set("verb", "ListRecords")
    url.searchParams.set("metadataPrefix", (repoUrl.endsWith("/openaire4")) ? "oai_openaire" : "oai_dc")
    return url.href
}

/**
 * Builds an OAI-PMH ListRecords URL from a resumption token.
 * @param {string} repoUrl The repository OAI-PMH endpoint.
 * @param {string} token The OAI-PMH resumption token.
 * @returns {string} The ListRecords URL for the next page.
 */
function buildResumptionUrl(repoUrl, token) {
    const url = new URL(repoUrl)
    url.searchParams.set("verb", "ListRecords")
    url.searchParams.set("resumptionToken", token)
    return url.href
}

/**
 * Checks whether a record has already been stored.
 * @param {object} record The parsed thesis metadata record.
 * @returns {boolean} True when the record is a duplicate.
 */
function isDuplicate(record) {
    const key = resultKey(record)
    if (!key) return true

    const hash = hashText(key)
    if (seenDocumentHashes.has(hash)) return true

    seenDocumentHashes.add(hash)
    return false
}

/**
 * Creates a short stable hash for duplicate detection.
 * @param {string} value The text value to hash.
 * @returns {string} The hexadecimal SHA-1 hash.
 */
function hashText(value) {
    return createHash("sha1").update(String(value)).digest("hex")
}

/**
 * Decides whether progress should be printed for the current page.
 * @param {number} processed The total number of processed records for the repository.
 * @param {number} currentPageRecords The number of records found in the current page.
 * @returns {boolean} True when a progress message should be printed.
 */
function shouldPrintProgress(processed, currentPageRecords) {
    return progressEvery > 0 && processed > 0 && processed % progressEvery < currentPageRecords
}

/**
 * Prints crawl progress for the current repository.
 * @param {number} page The current OAI-PMH page number.
 * @param {number} processed The number of processed records in the current repository.
 * @param {number} kept The number of stored records in the current repository.
 * @returns {void}
 */
function printProgress(page, processed, kept) {
    const memory = process.memoryUsage()
    const heapMb = Math.round(memory.heapUsed / 1024 / 1024)
    console.log(`  Page ${page}; processed: ${processed}; kept here: ${kept}; total: ${documentCount}; heap: ${heapMb} MB`)
}

/**
 * Truncates text to a maximum number of characters.
 * @param {string|null|undefined} value The text to truncate.
 * @param {number} maxChars The maximum number of characters to keep.
 * @returns {string|null} The truncated text, or null when the input is empty.
 */
function truncateText(value, maxChars) {
    if (!value) return null
    if (maxChars <= 0) return ""
    if (String(value).length <= maxChars) return String(value)
    return String(value).slice(0, maxChars).trimEnd() + "…"
}

/**
 * Applies KEY=value command-line arguments to process.env.
 *
 * This lets commands such as `npm run index OUTPUT_DESTINATION=2` work on Windows,
 * PowerShell, cmd.exe, macOS, and Linux without requiring shell-specific env syntax.
 * @returns {void}
 */
function applyCliEnvironmentOverrides() {
    for (const argument of process.argv.slice(2)) {
        const match = argument.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
        if (!match) continue

        const [, key, value] = match
        process.env[key] = value
    }
}

/**
 * Reads the optional build-time filter from CLI arguments or environment variables.
 * @returns {string} The optional build filter.
 */
function getOptionalFilter() {
    const args = process.argv
        .slice(2)
        .filter(argument => !argument.startsWith("--"))
        .filter(argument => !/^[A-Za-z_][A-Za-z0-9_]*=.*/.test(argument))

    return (args.join(" ") || process.env.FILTER || "").trim()
}

/**
 * Selects which repositories should be crawled.
 * @returns {object[]} The selected repository configuration objects.
 */
function getSelectedRepositories() {
    const requested = (process.env.REPOS || "")
        .split(",")
        .map(value => value.trim().toLowerCase())
        .filter(Boolean)

    if (requested.length === 0) return REPOSITORIES

    const selected = REPOSITORIES.filter(repository => requested.includes(repository.id.toLowerCase()))
    const missing = requested.filter(id => !REPOSITORIES.some(repository => repository.id.toLowerCase() === id))

    if (missing.length > 0) {
        console.warn(`Ignored unknown repository IDs: ${missing.join(", ")}`)
    }

    return selected.length > 0 ? selected : REPOSITORIES
}

await main()
