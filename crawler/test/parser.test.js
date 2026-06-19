import assert from "node:assert/strict"
import { describe, it } from "mocha"
import { parseOaiRecords, isThesis, matchesFilter, resultKey } from "../src/parser.js"

const repository = {
    id: "repo-1",
    name: "Example University"
}

describe("parseOaiRecords", () => {
    it("parses Dublin Core thesis metadata from namespaced OAI-PMH records", () => {
        const xml = `
            <OAI-PMH>
                <ListRecords>
                    <record>
                        <header>
                            <identifier>oai:example.edu:123</identifier>
                            <datestamp>2024-05-10</datestamp>
                        </header>
                        <metadata>
                            <oai_dc:dc>
                                <dc:title>Machine Learning &amp; Clinical Decision Support</dc:title>
                                <dc:creator>Ana Silva</dc:creator>
                                <dc:creator>Ana Silva</dc:creator>
                                <dc:creator>João Santos</dc:creator>
                                <dc:description>Short summary.</dc:description>
                                <dc:description>Longer abstract with &lt;strong&gt;markup&lt;/strong&gt; and &quot;quotes&quot;.</dc:description>
                                <dc:subject>Artificial Intelligence</dc:subject>
                                <dc:subject>Artificial Intelligence</dc:subject>
                                <dc:subject>Healthcare</dc:subject>
                                <dc:type>info:eu-repo/semantics/masterThesis</dc:type>
                                <dc:type>info:eu-repo/semantics/masterThesis</dc:type>
                                <dc:date>2024-05-01</dc:date>
                                <dc:language>eng</dc:language>
                                <dc:identifier>https://example.edu/handle/123</dc:identifier>
                                <dc:identifier>https://example.edu/bitstream/123/thesis.pdf?download=1</dc:identifier>
                            </oai_dc:dc>
                        </metadata>
                    </record>
                </ListRecords>
                <resumptionToken cursor="0">next-token</resumptionToken>
            </OAI-PMH>`

        const result = parseOaiRecords(xml, repository)

        assert.equal(result.oaiError, null)
        assert.equal(result.resumptionToken, "next-token")
        assert.equal(result.records.length, 1)
        assert.deepEqual(result.records[0], {
            repository: "repo-1",
            university: "Example University",
            title: "Machine Learning & Clinical Decision Support",
            authors: ["Ana Silva", "João Santos"],
            description: "Longer abstract with markup and \"quotes\".",
            year: "2024",
            subjects: ["Artificial Intelligence", "Healthcare"],
            type: ["info:eu-repo/semantics/masterThesis"],
            language: "eng",
            url: "https://example.edu/handle/123",
            fileUrl: "https://example.edu/bitstream/123/thesis.pdf?download=1",
            oaiIdentifier: "oai:example.edu:123",
            datestamp: "2024-05-10"
        })
    })

    it("skips deleted and empty records", () => {
        const xml = `
            <OAI-PMH>
                <ListRecords>
                    <record>
                        <header status="deleted">
                            <identifier>oai:example.edu:deleted</identifier>
                        </header>
                    </record>
                    <record>
                        <header>
                            <identifier></identifier>
                        </header>
                        <metadata>
                            <dc:title></dc:title>
                        </metadata>
                    </record>
                </ListRecords>
            </OAI-PMH>`

        const result = parseOaiRecords(xml, repository)

        assert.deepEqual(result.records, [])
        assert.equal(result.resumptionToken, null)
        assert.equal(result.oaiError, null)
    })

    it("returns OAI-PMH errors together with any parseable records", () => {
        const xml = `
            <OAI-PMH>
                <error code="badArgument">Missing required verb</error>
            </OAI-PMH>`

        const result = parseOaiRecords(xml, repository)

        assert.deepEqual(result.records, [])
        assert.deepEqual(result.oaiError, {
            code: "badArgument",
            message: "Missing required verb"
        })
    })
})

describe("isThesis", () => {
    it("recognizes repository semantic thesis types", () => {
        assert.equal(isThesis({ type: ["info:eu-repo/semantics/doctoralThesis"] }), true)
        assert.equal(isThesis({ type: ["info:eu-repo/semantics/masterThesis"] }), true)
    })

    it("recognizes Portuguese thesis wording after accent normalization", () => {
        assert.equal(isThesis({ description: "Dissertação de mestrado em Engenharia Informática" }), true)
    })

    it("rejects unrelated academic records", () => {
        assert.equal(isThesis({ title: "Conference paper about data mining", type: ["article"] }), false)
    })
})

describe("matchesFilter", () => {
    const record = {
        title: "Aplicação de Inteligência Artificial em Saúde",
        authors: ["Maria Costa"],
        description: "Dissertação de mestrado sobre apoio à decisão clínica.",
        subjects: ["Healthcare", "Machine Learning"],
        type: ["masterThesis"],
        year: "2023"
    }

    it("matches complete normalized phrases", () => {
        assert.equal(matchesFilter(record, "inteligencia artificial"), true)
    })

    it("matches significant terms while ignoring common stopwords", () => {
        assert.equal(matchesFilter(record, "machine learning in healthcare"), true)
    })

    it("rejects filters where not all significant terms are present", () => {
        assert.equal(matchesFilter(record, "machine learning robotics"), false)
    })

    it("treats blank or stopword-only filters as no filter", () => {
        assert.equal(matchesFilter(record, "de e para"), true)
        assert.equal(matchesFilter(record, "   "), true)
    })
})

describe("resultKey", () => {
    it("uses the most stable available identifier in priority order", () => {
        assert.equal(resultKey({ url: "https://example.edu/handle/1", fileUrl: "https://example.edu/file.pdf", oaiIdentifier: "oai:1" }), "https://example.edu/handle/1")
        assert.equal(resultKey({ fileUrl: "https://example.edu/file.pdf", oaiIdentifier: "oai:1" }), "https://example.edu/file.pdf")
        assert.equal(resultKey({ oaiIdentifier: "oai:1", title: "Title" }), "oai:1")
    })

    it("falls back to title, authors, and year when no URL or OAI identifier exists", () => {
        assert.equal(resultKey({ title: "Title", authors: ["Ana", "João"], year: "2022" }), "Title|Ana,João|2022")
    })
})
