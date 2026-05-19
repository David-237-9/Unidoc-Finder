const STOPWORDS = new Set([
    "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "do", "dos", "e", "em", "entre", "na", "nas", "no", "nos", "o", "os", "ou", "para", "por", "sem", "sob", "sobre", "um", "uma",
    "the", "and", "or", "of", "in", "on", "for", "to", "with", "without", "from", "by"
])

const DEFAULT_INDEX_DESCRIPTION_CHARS = Number(process.env.INDEX_DESCRIPTION_CHARS || 600)
const DEFAULT_MAX_TERMS_PER_DOCUMENT = Number(process.env.MAX_TERMS_PER_DOCUMENT || 250)

/**
 * Normalizes text for indexing and searching.
 * @param {string|null|undefined} value The raw value to normalize.
 * @returns {string} The normalized text.
 */
export function normalize(value) {
    return String(value || "")
        .replace(/<[^>]*>/g, " ")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
}

/**
 * Splits text into useful search terms.
 * @param {string|null|undefined} value The raw value to tokenize.
 * @returns {string[]} The normalized search terms.
 */
export function tokenize(value) {
    return normalize(value)
        .split(" ")
        .map(term => term.trim())
        .filter(term => term.length >= 2 && term.length <= 48 && !STOPWORDS.has(term))
}

/**
 * Builds a compact inverted index from a full document array.
 * @param {object[]} documents The documents to index.
 * @returns {object} An inverted index where each term maps to a flat list of document IDs and scores.
 */
export function buildInvertedIndex(documents) {
    const index = Object.create(null)

    documents.forEach((document, documentId) => {
        addDocumentToIndex(index, document, documentId)
    })

    return index
}

/**
 * Adds one document to an existing compact inverted index.
 * @param {object} index The inverted index to update.
 * @param {object} document The document to index.
 * @param {number} documentId The numeric document identifier.
 * @returns {number} The number of new terms added to the index.
 */
export function addDocumentToIndex(index, document, documentId) {
    let newTerms = 0
    const weights = getDocumentTermWeights(document)

    for (const [term, score] of weights.entries()) {
        if (!index[term]) {
            index[term] = []
            newTerms++
        }

        index[term].push(documentId, score)
    }

    return newTerms
}

/**
 * Calculates weighted search terms for one document.
 * @param {object} document The document to index.
 * @returns {Map<string, number>} A map where each term has its accumulated score.
 */
export function getDocumentTermWeights(document) {
    const weights = new Map()

    addTerms(weights, document.title, 9)
    addTerms(weights, document.authors, 4)
    addTerms(weights, document.subjects, 5)
    addTerms(weights, firstChars(document.description, DEFAULT_INDEX_DESCRIPTION_CHARS), 1)
    addTerms(weights, document.type, 2)
    addTerms(weights, document.year, 3)
    addTerms(weights, document.university, 2)

    return limitTerms(weights, DEFAULT_MAX_TERMS_PER_DOCUMENT)
}

/**
 * Searches a compact inverted index and returns ranked document IDs.
 * @param {object} index The compact inverted index.
 * @param {string} query The user search query.
 * @param {object} [options] Optional search settings.
 * @param {number} [options.limit] The maximum number of ranked IDs to return.
 * @param {boolean} [options.requireAllTerms] Whether every query term must match.
 * @returns {{docId: number, score: number}[]} Ranked document IDs and scores.
 */
export function searchDocumentIds(index, query, options = {}) {
    const {
        limit = 20,
        requireAllTerms = true
    } = options

    const terms = [...new Set(tokenize(query))]
    if (terms.length === 0) return []

    const candidateScores = new Map()

    for (const term of terms) {
        const postings = index[term] || []

        for (let i = 0; i < postings.length; i += 2) {
            const docId = postings[i]
            const termScore = postings[i + 1]
            const current = candidateScores.get(docId) || { score: 0, matchedTerms: 0 }

            current.score += termScore
            current.matchedTerms += 1
            candidateScores.set(docId, current)
        }
    }

    const results = []

    for (const [docId, candidate] of candidateScores.entries()) {
        if (requireAllTerms && candidate.matchedTerms < terms.length) continue
        results.push({ docId: Number(docId), score: candidate.score })
    }

    return results
        .sort((a, b) => b.score - a.score || a.docId - b.docId)
        .slice(0, limit)
}

/**
 * Searches an in-memory document collection using a compact inverted index.
 * @param {object[]} documents The indexed documents.
 * @param {object} index The compact inverted index.
 * @param {string} query The user search query.
 * @param {object} [options] Optional search settings.
 * @param {number} [options.limit] The maximum number of results to return.
 * @param {boolean} [options.requireAllTerms] Whether every query term must match.
 * @returns {object[]} The ranked search results.
 */
export function searchDocuments(documents, index, query, options = {}) {
    const candidateIds = searchDocumentIds(index, query, options)

    return candidateIds
        .map(candidate => ({ ...documents[candidate.docId], score: candidate.score }))
        .filter(result => Boolean(result.title || result.description || result.url))
}

/**
 * Adds weighted terms from one document field into a scoring map.
 * @param {Map<string, number>} weights The per-document term weights.
 * @param {string|string[]|null|undefined} value The field value to index.
 * @param {number} fieldWeight The score weight assigned to this field.
 * @returns {void}
 */
function addTerms(weights, value, fieldWeight) {
    const text = Array.isArray(value) ? value.join(" ") : value
    const terms = tokenize(text)

    for (const term of terms) {
        weights.set(term, (weights.get(term) || 0) + fieldWeight)
    }
}

/**
 * Keeps only the highest scoring terms in a document.
 * @param {Map<string, number>} weights The full per-document term weights.
 * @param {number} maxTerms The maximum number of terms to keep.
 * @returns {Map<string, number>} The limited term-weight map.
 */
function limitTerms(weights, maxTerms) {
    if (maxTerms <= 0 || weights.size <= maxTerms) return weights

    return new Map(
        [...weights.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxTerms)
    )
}

/**
 * Returns the first characters of a text value.
 * @param {string|null|undefined} value The text to truncate.
 * @param {number} maxChars The maximum number of characters to keep.
 * @returns {string|null} The truncated text, or null when the input is empty.
 */
function firstChars(value, maxChars) {
    if (!value) return null
    if (maxChars <= 0) return ""
    return String(value).slice(0, maxChars)
}
