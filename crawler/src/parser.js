const THESIS_PATTERN = /info:eu-repo\/semantics\/(master|doctoral)thesis|masterthesis|doctoralthesis|\bmaster thesis\b|\bdoctoral thesis\b|\bphd thesis\b|\btese\b|\bdissertacao\b|\bmestrado\b|\bdoutoramento\b|\bdoutoral\b/i

const STOPWORDS = new Set([
    "a", "ao", "aos", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "na", "nas", "no", "nos", "o", "os", "para", "por", "um", "uma",
    "the", "and", "or", "of", "in", "on", "for", "to", "with"
])

/**
 * Parses OAI-PMH Dublin Core records from an XML page.
 * @param {string} xml The OAI-PMH XML response.
 * @param {object} repository The repository configuration object.
 * @returns {{records: object[], resumptionToken: string|null}} The parsed records and the next OAI-PMH token.
 */
export function parseOaiRecords(xml, repository) {
    const records = []
    const oaiError = getOaiError(xml)

    for (const recordXml of iterateXmlElements(xml, "record")) {
        if (isDeletedRecord(recordXml)) continue

        const headerXml = getFirstXmlElementContent(recordXml, "header") || ""
        const metadataXml = getFirstXmlElementContent(recordXml, "metadata") || ""

        const identifiers = getXmlElementTexts(metadataXml, "identifier")
        const types = getXmlElementTexts(metadataXml, "type")
        const titles = getXmlElementTexts(metadataXml, "title")
        const creators = getXmlElementTexts(metadataXml, "creator")
        const descriptions = getXmlElementTexts(metadataXml, "description")
        const subjects = getXmlElementTexts(metadataXml, "subject")
        const dates = getXmlElementTexts(metadataXml, "date")
        const languages = getXmlElementTexts(metadataXml, "language")

        const url = pickLandingUrl(identifiers)
        const fileUrl = pickPdfUrl(identifiers)

        const data = {
            repository: repository.id,
            university: repository.name,
            title: cleanText(titles[0]),
            authors: unique(creators.map(cleanText).filter(Boolean)),
            description: pickDescription(descriptions),
            year: extractYear(dates) || extractYear(identifiers),
            subjects: unique(subjects.map(cleanText).filter(Boolean)),
            type: unique(types.map(cleanText).filter(Boolean)),
            language: languages[0] || null,
            url,
            fileUrl,
            oaiIdentifier: getFirstXmlElementText(headerXml, "identifier"),
            datestamp: getFirstXmlElementText(headerXml, "datestamp")
        }

        if (data.title || data.description || data.url || data.oaiIdentifier) {
            records.push(data)
        }
    }

    const tokens = getXmlElementTexts(xml, "resumptionToken")

    return {
        records,
        resumptionToken: tokens.length > 0 ? tokens[tokens.length - 1] : null,
        oaiError
    }
}

/**
 * Extracts an OAI-PMH error from a response, when present.
 * @param {string} xml The OAI-PMH XML response.
 * @returns {{code: string, message: string}|null} The OAI error, or null when the response has no OAI error.
 */
function getOaiError(xml) {
    const match = String(xml || "").match(
        /<(?:[\w.-]+:)?error\b[^>]*\bcode=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?error>/i
    )

    if (!match) return null

    return {
        code: match[1],
        message: cleanText(match[2]) || ""
    }
}

/**
 * Checks whether a parsed record looks like a thesis or dissertation.
 * @param {object} record The parsed thesis metadata record.
 * @returns {boolean} True when the record looks like a thesis or dissertation.
 */
export function isThesis(record) {
    const haystack = normalizeForMatch([
        record.title,
        record.description,
        ...(record.type || []),
        ...(record.subjects || []),
        record.url,
        record.fileUrl,
        record.oaiIdentifier
    ].filter(Boolean).join(" "))

    return THESIS_PATTERN.test(haystack)
}

/**
 * Checks whether a parsed record matches a user-provided filter.
 * @param {object} record The parsed thesis metadata record.
 * @param {string} filter The text filter to apply.
 * @returns {boolean} True when the record matches the filter.
 */
export function matchesFilter(record, filter) {
    const terms = getFilterTerms(filter)
    if (terms.length === 0) return true

    const haystack = normalizeForMatch([
        record.title,
        ...(record.authors || []),
        record.description,
        ...(record.subjects || []),
        ...(record.type || []),
        record.year
    ].filter(Boolean).join(" "))

    const normalizedFilter = normalizeForMatch(filter)

    if (normalizedFilter.length > 0 && haystack.includes(normalizedFilter)) return true

    return terms.every(term => haystack.includes(term))
}

/**
 * Builds a stable key used to remove duplicate records.
 * @param {object} record The parsed thesis metadata record.
 * @returns {string} The best available unique key for the record.
 */
export function resultKey(record) {
    return record.url || record.fileUrl || record.oaiIdentifier || `${record.title}|${record.authors?.join(",")}|${record.year}`
}

/**
 * Iterates over XML elements with the requested local tag name without storing all matches at once.
 * @param {string} xml The XML text to search.
 * @param {string} localName The tag name without namespace prefix.
 * @returns {Generator<string>} The matching XML element strings.
 */
function* iterateXmlElements(xml, localName) {
    const text = String(xml || "")
    const tag = escapeRegExp(localName)
    const pattern = new RegExp(`<(?:[\\w.-]+:)?${tag}\\b[^>]*>[\\s\\S]*?<\\/(?:[\\w.-]+:)?${tag}>`, "gi")
    let match = pattern.exec(text)

    while (match) {
        yield match[0]
        match = pattern.exec(text)
    }
}

/**
 * Extracts the inner XML of the first element with the requested local tag name.
 * @param {string} xml The XML text to search.
 * @param {string} localName The tag name without namespace prefix.
 * @returns {string|null} The inner XML content, or null when the element is missing.
 */
function getFirstXmlElementContent(xml, localName) {
    const tag = escapeRegExp(localName)
    const pattern = new RegExp(`<(?:[\\w.-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tag}>`, "i")
    const match = String(xml || "").match(pattern)
    return match ? match[1] : null
}

/**
 * Extracts text values from every element with the requested local tag name.
 * @param {string} xml The XML text to search.
 * @param {string} localName The tag name without namespace prefix.
 * @returns {string[]} The cleaned text values.
 */
function getXmlElementTexts(xml, localName) {
    const tag = escapeRegExp(localName)
    const pattern = new RegExp(`<(?:[\\w.-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tag}>`, "gi")
    const values = []
    let match = pattern.exec(String(xml || ""))

    while (match) {
        const value = cleanText(match[1])
        if (value) values.push(value)
        match = pattern.exec(String(xml || ""))
    }

    return values
}

/**
 * Extracts the first text value from an element with the requested local tag name.
 * @param {string} xml The XML text to search.
 * @param {string} localName The tag name without namespace prefix.
 * @returns {string|null} The cleaned text value, or null when the element is missing.
 */
function getFirstXmlElementText(xml, localName) {
    const values = getXmlElementTexts(xml, localName)
    return values[0] || null
}

/**
 * Checks whether an OAI-PMH record is marked as deleted.
 * @param {string} recordXml The full XML of one OAI-PMH record.
 * @returns {boolean} True when the record has a deleted header status.
 */
function isDeletedRecord(recordXml) {
    return /<header\b[^>]*\bstatus=["']deleted["']/i.test(String(recordXml || ""))
}

/**
 * Cleans text extracted from XML.
 * @param {string|null|undefined} value The raw text value.
 * @returns {string|null} The cleaned text, or null when it is empty.
 */
function cleanText(value) {
    const cleaned = stripTags(decodeXmlEntities(String(value || "")))
        .replace(/\s+/g, " ")
        .trim()

    return cleaned || null
}

/**
 * Removes XML or HTML tags from text.
 * @param {string} value The text that may contain tags.
 * @returns {string} The text without tags.
 */
function stripTags(value) {
    return String(value || "").replace(/<[^>]*>/g, " ")
}

/**
 * Decodes the most common XML entities.
 * @param {string} value The XML-encoded text.
 * @returns {string} The decoded text.
 */
function decodeXmlEntities(value) {
    return String(value || "")
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
}

/**
 * Normalizes text for case-insensitive and accent-insensitive matching.
 * @param {string|null|undefined} value The text to normalize.
 * @returns {string} The normalized text.
 */
function normalizeForMatch(value) {
    return String(cleanText(value) || "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
}

/**
 * Converts a user filter into searchable terms.
 * @param {string} filter The user-provided text filter.
 * @returns {string[]} The normalized terms that should be matched.
 */
function getFilterTerms(filter) {
    return normalizeForMatch(filter)
        .split(/[^a-z0-9]+/i)
        .map(term => term.trim())
        .filter(term => term.length >= 2 && !STOPWORDS.has(term))
}

/**
 * Removes duplicate values while preserving their original order.
 * @param {string[]} values The values to deduplicate.
 * @returns {string[]} The unique values.
 */
function unique(values) {
    return [...new Set(values)]
}

/**
 * Picks the longest description because it is usually the abstract.
 * @param {string[]} descriptions The candidate description values.
 * @returns {string|null} The best description, or null when none exists.
 */
function pickDescription(descriptions) {
    const cleaned = descriptions.map(cleanText).filter(Boolean)
    if (cleaned.length === 0) return null

    return cleaned.sort((a, b) => b.length - a.length)[0]
}

/**
 * Extracts the first plausible publication year from one or more values.
 * @param {string|string[]} values The values that may contain a year.
 * @returns {string|null} The year, or null when no year is found.
 */
function extractYear(values) {
    const text = Array.isArray(values) ? values.join(" ") : String(values || "")
    const match = text.match(/\b(19|20)\d{2}\b/)
    return match ? match[0] : null
}

/**
 * Picks a non-PDF landing page URL from Dublin Core identifiers.
 * @param {string[]} identifiers The identifier values from the record.
 * @returns {string|null} The landing page URL, or null when none exists.
 */
function pickLandingUrl(identifiers) {
    return identifiers.find(value => /^https?:\/\//i.test(value) && !isPdfUrl(value)) || null
}

/**
 * Picks a PDF URL from Dublin Core identifiers.
 * @param {string[]} identifiers The identifier values from the record.
 * @returns {string|null} The PDF URL, or null when none exists.
 */
function pickPdfUrl(identifiers) {
    return identifiers.find(value => /^https?:\/\//i.test(value) && isPdfUrl(value)) || null
}

/**
 * Checks whether a URL appears to point to a PDF file.
 * @param {string} value The URL or identifier to check.
 * @returns {boolean} True when the value looks like a PDF URL.
 */
function isPdfUrl(value) {
    return /\.pdf(\?|#|$)/i.test(String(value || ""))
}

/**
 * Escapes a string so it can be used safely inside a regular expression.
 * @param {string} value The raw string to escape.
 * @returns {string} The escaped regular expression fragment.
 */
function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
