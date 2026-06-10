package com.unidocfinder.backend.elasticsearch

import co.elastic.clients.elasticsearch._types.query_dsl.Query
import com.unidocfinder.backend.domain.ThesisDocument
import com.unidocfinder.backend.repository.ThesisElasticRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.elasticsearch.client.elc.NativeQuery
import org.springframework.data.elasticsearch.core.ElasticsearchOperations
import org.springframework.data.elasticsearch.core.SearchHits
import org.springframework.stereotype.Repository

@Repository
class ThesisElasticRepositoryImpl(
    private val elasticsearchOperations: ElasticsearchOperations
) : ThesisElasticRepository {

    override fun searchThesis(query: String, page: Int, size: Int): List<ThesisDocument> {
        val normalizedQuery = normalizeSearchQuery(query)

        if (normalizedQuery.isBlank()) {
            return emptyList()
        }

        val searchableFields = listOf(
            "title",
            "abstract",
            "authors",
            "subjects",
            "type",
            "language",
            "university"
        )

        val terms = extractSearchTerms(normalizedQuery)
        val requiredTermQueries = terms.map { term ->
            buildTermQuery(term, searchableFields)
        }
        val phraseBoostQueries = buildPhraseBoostQueries(normalizedQuery, searchableFields)

        val searchQuery = NativeQuery.builder()
            .withQuery(
                Query.of { q ->
                    q.bool { bool ->
                        bool.must(requiredTermQueries)
                        bool.should(phraseBoostQueries)
                    }
                }
            )
            .withPageable(PageRequest.of(page - 1, size))
            .build()

        val hits: SearchHits<ThesisDocument> = elasticsearchOperations.search(
            searchQuery,
            ThesisDocument::class.java
        )

        return hits.map { it.content }.toList()
    }

    override fun save(entity: ThesisDocument): ThesisDocument {
        return elasticsearchOperations.save(entity)
    }

    override fun saveAll(entities: List<ThesisDocument>): List<ThesisDocument> {
        return entities.map { elasticsearchOperations.save(it) }
    }

    private fun buildTermQuery(term: String, fields: List<String>): Query {
        val wildcardValue = "*${escapeWildcardValue(term.lowercase())}*"
        val fieldQueries = fields.flatMap { field ->
            listOf(
                Query.of { q ->
                    q.match { match ->
                        match.field(field).query(term).fuzziness("AUTO")
                    }
                },
                Query.of { q ->
                    q.wildcard { wildcard ->
                        wildcard.field(field).value(wildcardValue).caseInsensitive(true)
                    }
                }
            )
        }

        return Query.of { q ->
            q.bool { bool ->
                bool.should(fieldQueries)
                bool.minimumShouldMatch("1")
            }
        }
    }

    private fun buildPhraseBoostQueries(query: String, fields: List<String>): List<Query> {
        if (!query.contains(' ')) {
            return emptyList()
        }

        return fields.map { field ->
            Query.of { q ->
                q.matchPhrase { phrase ->
                    phrase.field(field).query(query).slop(2)
                }
            }
        }
    }

    /**
     * URLSearchParams renders spaces as '+'. Spring usually decodes that back to a
     * real space before this method is called, but this also fixes requests that
     * reach the backend as "machine+learning" instead of "machine learning".
     */
    private fun normalizeSearchQuery(query: String): String {
        return query
            .replace(PLUS_BETWEEN_WORDS, " ")
            .replace(WHITESPACE, " ")
            .trim()
    }

    private fun extractSearchTerms(query: String): List<String> {
        val terms = WORD.findAll(query)
            .map { it.value }
            .filter { it.length > 1 }
            .map { it.lowercase() }
            .distinct()
            .toList()

        return terms.ifEmpty { listOf(query.lowercase()) }
    }

    private fun escapeWildcardValue(value: String): String {
        return value
            .replace("\\", "\\\\")
            .replace("*", "\\*")
            .replace("?", "\\?")
    }

    companion object {
        private val PLUS_BETWEEN_WORDS = Regex("(?<=[\\p{L}\\p{N}])\\+(?=[\\p{L}\\p{N}])")
        private val WHITESPACE = Regex("\\s+")
        private val WORD = Regex("[\\p{L}\\p{N}]+")
    }
}
