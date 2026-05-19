import fs from "node:fs/promises"
import path from "node:path"
import { normalize, searchDocumentIds } from "./local-search.js"

const query = getQuery()
const outputDir = process.env.INDEX_DIR || "data"
const limit = Number(process.env.LIMIT || 20)
const candidateMultiplier = Number(process.env.CANDIDATE_MULTIPLIER || 5)
const requireAllTerms = process.env.REQUIRE_ALL_TERMS !== "false"

if (!query) {
    console.error("Missing search query.")
    console.error("Example: node src/search.js \"artificial intelligence\"")
    process.exit(1)
}

await main()

/**
 * Runs a local search and prints the results to the console.
 * @returns {Promise<void>} A promise that resolves when the results have been printed.
 */
async function main() {
    const started = performance.now()
    const localIndex = await loadLocalIndex(outputDir)
    const loadedAt = performance.now()
    const candidates = searchDocumentIds(localIndex.index, query, {
        limit: limit * candidateMultiplier,
        requireAllTerms
    })
    const searchedAt = performance.now()
    const documents = await loadCandidateDocuments(localIndex, candidates)
    const results = rankLoadedDocuments(documents, query).slice(0, limit)
    const finished = performance.now()

    printResults(results, {
        query,
        totalDocuments: localIndex.totalDocuments,
        loadMs: loadedAt - started,
        searchMs: searchedAt - loadedAt,
        documentLoadMs: finished - searchedAt,
        totalMs: finished - started
    })
}

/**
 * Loads the local inverted index and document offsets from disk.
 * @param {string} dir The directory containing the index files.
 * @returns {Promise<{index: object, offsets: number[], documentsPath: string, totalDocuments: number}>} The loaded index metadata.
 */
async function loadLocalIndex(dir) {
    const indexPath = path.join(dir, "inverted-index.json")
    const offsetsPath = path.join(dir, "documents-offsets.json")
    const documentsPath = path.join(dir, "documents.jsonl")

    try {
        const [indexRaw, offsetsRaw] = await Promise.all([
            fs.readFile(indexPath, "utf8"),
            fs.readFile(offsetsPath, "utf8")
        ])
        const offsets = JSON.parse(offsetsRaw)

        return {
            index: JSON.parse(indexRaw),
            offsets,
            documentsPath,
            totalDocuments: offsets.length
        }
    } catch (error) {
        console.error(`No valid local index was found in "${dir}".`)
        console.error("Build it first with: node src/build-index.js")
        console.error(`Error: ${error.message}`)
        process.exit(1)
    }
}

/**
 * Loads only the JSONL documents needed for the current search result candidates.
 * @param {{documentsPath: string, offsets: number[]}} localIndex The local index metadata.
 * @param {{docId: number, score: number}[]} candidates The ranked candidate document IDs.
 * @returns {Promise<object[]>} The loaded candidate documents with scores.
 */
async function loadCandidateDocuments(localIndex, candidates) {
    const file = await fs.open(localIndex.documentsPath, "r")

    try {
        const documents = []

        for (const candidate of candidates) {
            const offset = localIndex.offsets[candidate.docId]
            if (offset === undefined) continue

            const document = await readJsonLineAtOffset(file, offset)
            if (!document) continue

            documents.push({ ...document, score: candidate.score })
        }

        return documents
    } finally {
        await file.close()
    }
}

/**
 * Reads and parses one JSONL line from a file at a known byte offset.
 * @param {fs.FileHandle} file The open JSONL file handle.
 * @param {number} offset The byte offset where the JSON line starts.
 * @returns {Promise<object|null>} The parsed object, or null when it cannot be read.
 */
async function readJsonLineAtOffset(file, offset) {
    const chunks = []
    const buffer = Buffer.alloc(8192)
    let position = offset
    let totalBytes = 0

    while (true) {
        const { bytesRead } = await file.read(buffer, 0, buffer.length, position)
        if (bytesRead === 0) break

        const currentChunk = buffer.subarray(0, bytesRead)
        const newlineIndex = currentChunk.indexOf(10)
        const bytesToCopy = newlineIndex >= 0 ? newlineIndex : bytesRead

        chunks.push(Buffer.from(currentChunk.subarray(0, bytesToCopy)))
        totalBytes += bytesToCopy

        if (newlineIndex >= 0) break
        if (totalBytes > 256 * 1024) throw new Error("Document line is too large to read safely.")

        position += bytesRead
    }

    if (chunks.length === 0) return null

    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

/**
 * Applies final phrase-aware ranking to already loaded documents.
 * @param {object[]} documents The candidate documents loaded from disk.
 * @param {string} searchQuery The original user search query.
 * @returns {object[]} The final ranked results.
 */
function rankLoadedDocuments(documents, searchQuery) {
    const normalizedPhrase = normalize(searchQuery)

    return documents
        .map(document => addPhraseBonus(document, normalizedPhrase))
        .sort((a, b) => b.score - a.score || String(b.year || "").localeCompare(String(a.year || "")))
}

/**
 * Adds a score bonus when the full query phrase appears in the title or document text.
 * @param {object} document The candidate document.
 * @param {string} normalizedPhrase The normalized query phrase.
 * @returns {object} The document with an updated score.
 */
function addPhraseBonus(document, normalizedPhrase) {
    if (!normalizedPhrase) return document

    const titleText = normalize(document.title)
    const fullText = normalize([
        document.title,
        ...(document.authors || []),
        document.description,
        ...(document.subjects || []),
        ...(document.type || []),
        document.year,
        document.university
    ].filter(Boolean).join(" "))

    if (titleText.includes(normalizedPhrase)) return { ...document, score: document.score + 50 }
    if (fullText.includes(normalizedPhrase)) return { ...document, score: document.score + 20 }

    return document
}

/**
 * Prints ranked results and timing information to the console.
 * @param {object[]} results The ranked search results.
 * @param {object} stats The search timing and count statistics.
 * @param {string} stats.query The original search query.
 * @param {number} stats.totalDocuments The number of indexed documents.
 * @param {number} stats.loadMs The time spent loading the index in milliseconds.
 * @param {number} stats.searchMs The time spent searching the index in milliseconds.
 * @param {number} stats.documentLoadMs The time spent loading candidate documents in milliseconds.
 * @param {number} stats.totalMs The total runtime in milliseconds.
 * @returns {void}
 */
function printResults(results, stats) {
    console.log(`Search: "${stats.query}"`)
    console.log(`Indexed documents: ${stats.totalDocuments}`)
    console.log(`Results: ${results.length}`)
    console.log(`Time: ${stats.totalMs.toFixed(1)}ms total (${stats.loadMs.toFixed(1)}ms loading, ${stats.searchMs.toFixed(1)}ms searching, ${stats.documentLoadMs.toFixed(1)}ms loading documents)\n`)

    if (results.length === 0) return

    for (const [index, result] of results.entries()) {
        console.log("-".repeat(90))
        console.log(`#${index + 1} ${result.title || "Untitled"}`)
        console.log(`Score: ${result.score}`)
        console.log(`University/Repository: ${result.university}`)
        console.log(`Authors: ${result.authors?.length ? result.authors.join("; ") : "N/A"}`)
        console.log(`Year: ${result.year || "N/A"}`)
        console.log(`Description: ${shorten(result.description, 700) || "N/A"}`)
        if (result.url) console.log(`URL: ${result.url}`)
        if (result.fileUrl) console.log(`PDF: ${result.fileUrl}`)
    }

    console.log("\nJSON summary:")
    console.log(JSON.stringify(results.map(toPrintableObject), null, 2))
}

/**
 * Converts an internal result object into the object printed in the JSON summary.
 * @param {object} record The internal result object.
 * @returns {object} The printable result object.
 */
function toPrintableObject(record) {
    return {
        title: record.title,
        authors: record.authors,
        description: record.description,
        year: record.year,
        university: record.university,
        url: record.url,
        pdf: record.fileUrl,
        score: record.score
    }
}

/**
 * Shortens long text for console output.
 * @param {string|null|undefined} value The text to shorten.
 * @param {number} maxLength The maximum output length.
 * @returns {string|null} The shortened text, or null when the input is empty.
 */
function shorten(value, maxLength) {
    if (!value) return null
    if (value.length <= maxLength) return value
    return value.slice(0, maxLength - 1).trimEnd() + "…"
}

/**
 * Reads the search query from CLI arguments or environment variables.
 * @returns {string} The search query.
 */
function getQuery() {
    const args = process.argv.slice(2).filter(argument => !argument.startsWith("--"))
    return (args.join(" ") || process.env.QUERY || process.env.FILTER || "").trim()
}
