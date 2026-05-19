import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"
import { fetchText } from "./fetcher.js"
import { parseOaiRecords, isThesis, matchesFilter, resultKey } from "./parser.js"
import { REPOSITORIES } from "./repositories.js"
import { addDocumentToIndex } from "../localsearch/local-search.js"

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
const seenDocumentHashes = new Set()
const documentOffsets = []
const invertedIndex = Object.create(null)
let indexedTermCount = 0
let documentCount = 0

/**
 * Runs the complete offline indexing process.
 * @returns {Promise<void>} A promise that resolves when the index files are written.
 */
async function main() {
    const started = Date.now()
    const documentsPath = path.join(outputDir, "documents.jsonl")
    const offsetsPath = path.join(outputDir, "documents-offsets.json")
    const indexPath = path.join(outputDir, "inverted-index.json")
    const metadataPath = path.join(outputDir, "metadata.json")

    console.log("Building the local thesis/dissertation index.")
    console.log(`Repositories: ${selectedRepositories.map(repository => repository.id).join(", ")}`)
    console.log(`Output: ${documentsPath} + ${indexPath}`)
    console.log("The builder now streams documents to disk to avoid Node.js heap exhaustion.")

    if (optionalBuildFilter) {
        console.log(`Build filter: "${optionalBuildFilter}"`)
        console.log("Only matching documents will be stored. For a general search engine, build without this filter.")
    }

    console.log("") // ESmpty line for better readability

    await fsp.rm(outputDir, { recursive: true, force: true })
    await fsp.mkdir(outputDir, { recursive: true })

    const documentStream = fs.createWriteStream(documentsPath, { encoding: "utf8" })
    let currentOffset = 0

    try {
        for (const repository of selectedRepositories) {
            if (maxDocuments > 0 && documentCount >= maxDocuments) break
            currentOffset = await crawlRepository(repository, documentStream, currentOffset)
        }
    } finally {
        await closeWriteStream(documentStream)
    }

    await writeJsonFile(offsetsPath, documentOffsets, false)
    await writeJsonObjectFile(indexPath, invertedIndex)
    await writeJsonFile(metadataPath, {
        generatedAt: new Date().toISOString(),
        repositories: selectedRepositories.map(repository => repository.id),
        optionalBuildFilter: optionalBuildFilter || null,
        documents: documentCount,
        terms: indexedTermCount,
        format: "jsonl-documents-plus-compact-inverted-index",
        maxDescriptionChars,
        indexDescriptionChars: Number(process.env.INDEX_DESCRIPTION_CHARS || 600),
        maxTermsPerDocument: Number(process.env.MAX_TERMS_PER_DOCUMENT || 250)
    }, true)

    const elapsed = ((Date.now() - started) / 1000).toFixed(1)

    console.log("\n" + "=".repeat(90))
    console.log(`Index completed in ${elapsed}s.`)
    console.log(`Stored documents: ${documentCount}`)
    console.log(`Indexed terms: ${indexedTermCount}`)
    console.log(`Files: ${documentsPath}, ${offsetsPath}, ${indexPath}, ${metadataPath}`)
    console.log("Search locally with: node src/search.js \"artificial intelligence\"")
}

/**
 * Crawls one OAI-PMH repository and stores matching thesis records.
 * @param {object} repository The repository configuration.
 * @param {string} repository.id The repository identifier.
 * @param {string} repository.name The repository display name.
 * @param {string} repository.oaiUrl The repository OAI-PMH endpoint.
 * @param {fs.WriteStream} documentStream The stream where JSONL documents are written.
 * @param {number} initialOffset The current byte offset in the JSONL document file.
 * @returns {Promise<number>} The updated byte offset after processing the repository.
 */
async function crawlRepository(repository, documentStream, initialOffset) {
    let nextUrl = buildListRecordsUrl(repository.oaiUrl)
    let processed = 0
    let kept = 0
    let page = 1
    let currentOffset = initialOffset

    console.log(`=== ${repository.name} (${repository.id}) ===`)

    while (nextUrl) {
        if (maxDocuments > 0 && documentCount >= maxDocuments) return currentOffset

        if (maxRecordsPerRepository > 0 && processed >= maxRecordsPerRepository) {
            console.log(`MAX_RECORDS_PER_REPO reached for ${repository.id}: ${processed}`)
            return currentOffset
        }

        const xml = await fetchText(nextUrl)
        if (!xml) return currentOffset

        const { records, resumptionToken } = parseOaiRecords(xml, repository)

        for (const record of records) {
            processed++

            if (maxRecordsPerRepository > 0 && processed > maxRecordsPerRepository) break
            if (!isThesis(record)) continue
            if (optionalBuildFilter && !matchesFilter(record, optionalBuildFilter)) continue
            if (isDuplicate(record)) continue

            const document = prepareDocument(record)
            const line = JSON.stringify(document) + "\n"
            const lineBytes = Buffer.byteLength(line, "utf8")

            documentOffsets.push(currentOffset)
            await writeToStream(documentStream, line)
            indexedTermCount += addDocumentToIndex(invertedIndex, document, documentCount)

            currentOffset += lineBytes
            documentCount++
            kept++

            if (maxDocuments > 0 && documentCount >= maxDocuments) break
        }

        if (shouldPrintProgress(processed, records.length)) {
            printProgress(page, processed, kept)
        }

        nextUrl = resumptionToken ? buildResumptionUrl(repository.oaiUrl, resumptionToken) : null
        page++

        if (nextUrl && crawlDelayMs > 0) await delay(crawlDelayMs)
    }

    console.log(`Finished ${repository.id}. Processed: ${processed}; kept: ${kept}; total: ${documentCount}\n`)
    return currentOffset
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
        datestamp: record.datestamp || null
    }
}

/**
 * Writes a JSON file using the normal serializer.
 * @param {string} filePath The file path to write.
 * @param {unknown} value The value to serialize.
 * @param {boolean} pretty Whether the JSON should be pretty-printed.
 * @returns {Promise<void>} A promise that resolves when the file has been written.
 */
async function writeJsonFile(filePath, value, pretty) {
    const json = pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)
    await fsp.writeFile(filePath, json, "utf8")
}

/**
 * Writes a large JSON object through a stream to avoid duplicating it in memory.
 * @param {string} filePath The file path to write.
 * @param {object} object The object to serialize.
 * @returns {Promise<void>} A promise that resolves when the file has been written.
 */
async function writeJsonObjectFile(filePath, object) {
    const stream = fs.createWriteStream(filePath, { encoding: "utf8" })
    let first = true

    await writeToStream(stream, "{")

    for (const key in object) {
        if (!Object.prototype.hasOwnProperty.call(object, key)) continue
        if (!first) await writeToStream(stream, ",")
        await writeToStream(stream, JSON.stringify(key) + ":" + JSON.stringify(object[key]))
        first = false
    }

    await writeToStream(stream, "}")
    await closeWriteStream(stream)
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
 * @param {string} oaiUrl The repository OAI-PMH endpoint.
 * @returns {string} The ListRecords URL.
 */
function buildListRecordsUrl(oaiUrl) {
    const url = new URL(oaiUrl)
    url.searchParams.set("verb", "ListRecords")
    url.searchParams.set("metadataPrefix", "oai_dc")
    return url.href
}

/**
 * Builds an OAI-PMH ListRecords URL from a resumption token.
 * @param {string} oaiUrl The repository OAI-PMH endpoint.
 * @param {string} token The OAI-PMH resumption token.
 * @returns {string} The ListRecords URL for the next page.
 */
function buildResumptionUrl(oaiUrl, token) {
    const url = new URL(oaiUrl)
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
 * Reads the optional build-time filter from CLI arguments or environment variables.
 * @returns {string} The optional build filter.
 */
function getOptionalFilter() {
    const args = process.argv.slice(2).filter(argument => !argument.startsWith("--"))
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
