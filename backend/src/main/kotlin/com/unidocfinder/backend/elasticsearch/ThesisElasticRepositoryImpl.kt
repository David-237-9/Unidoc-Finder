package com.unidocfinder.backend.elasticsearch

import co.elastic.clients.elasticsearch._types.query_dsl.Query
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery
import co.elastic.clients.elasticsearch._types.query_dsl.Operator
import co.elastic.clients.elasticsearch._types.query_dsl.MatchQuery
import co.elastic.clients.elasticsearch._types.query_dsl.WildcardQuery
import co.elastic.clients.elasticsearch._types.query_dsl.MultiMatchQuery
import co.elastic.clients.elasticsearch._types.query_dsl.MatchPhraseQuery
import co.elastic.clients.elasticsearch._types.query_dsl.TermQuery
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

    override fun searchThesis(
        query: String,
        page: Int,
        size: Int,
        university: String?,
        type: List<String>?,
        author: String?,
        subject: List<String>?,
        language: List<String>?,
        year: String?
    ): List<ThesisDocument> {
        val normalizedQuery = normalizeSearchQuery(query)

        // Build filter queries
        val filterQueries = mutableListOf<Query>()

        if (!university.isNullOrBlank()) {
            filterQueries.add(
                Query.of { q -> q.term(TermQuery.of { t -> t.field("university.keyword").value(university) }) }
            )
        }

        // Handle multiple types - use SHOULD if multiple, MUST if single
        if (!type.isNullOrEmpty()) {
            if (type.size == 1) {
                filterQueries.add(
                    Query.of { q -> q.term(TermQuery.of { t -> t.field("type.keyword").value(type[0]) }) }
                )
            } else {
                val typeQueries = type.map { t ->
                    Query.of { q -> q.term(TermQuery.of { tq -> tq.field("type.keyword").value(t) }) }
                }
                filterQueries.add(
                    Query.of { q -> q.bool(BoolQuery.of { b -> b.should(typeQueries).minimumShouldMatch("1") }) }
                )
            }
        }

        if (!author.isNullOrBlank()) {
            filterQueries.add(
                Query.of { q -> q.match(MatchQuery.of { m -> m.field("authors").query(author) }) }
            )
        }

        // Handle multiple subjects - search similar to main query with multi-match
        if (!subject.isNullOrEmpty()) {
            val subjectFields = listOf("title", "abstract", "subjects")
            if (subject.size == 1) {
                // Single subject: use multi-match with AND operator across relevant fields
                val normalizedSubject = normalizeSearchQuery(subject[0])
                if (normalizedSubject.isNotBlank()) {
                    filterQueries.add(
                        Query.of { q ->
                            q.multiMatch(MultiMatchQuery.of { mm ->
                                mm.query(normalizedSubject)
                                    .fields(subjectFields)
                                    .operator(Operator.And)
                            })
                        }
                    )
                }
            } else {
                // Multiple subjects: each should match as a multi-match query, at least one must match
                val subjectQueries = subject.mapNotNull { s ->
                    val normalizedSubject = normalizeSearchQuery(s)
                    if (normalizedSubject.isNotBlank()) {
                        Query.of { q ->
                            q.multiMatch(MultiMatchQuery.of { mm ->
                                mm.query(normalizedSubject)
                                    .fields(subjectFields)
                                    .operator(Operator.And)
                            })
                        }
                    } else {
                        null
                    }
                }
                if (subjectQueries.isNotEmpty()) {
                    filterQueries.add(
                        Query.of { q -> q.bool(BoolQuery.of { b -> b.should(subjectQueries).minimumShouldMatch("1") }) }
                    )
                }
            }
        }

        // Handle multiple languages - use SHOULD if multiple, MUST if single
        if (!language.isNullOrEmpty()) {
            if (language.size == 1) {
                filterQueries.add(
                    Query.of { q -> q.term(TermQuery.of { t -> t.field("language.keyword").value(language[0]) }) }
                )
            } else {
                val languageQueries = language.map { lang ->
                    Query.of { q -> q.term(TermQuery.of { t -> t.field("language.keyword").value(lang) }) }
                }
                filterQueries.add(
                    Query.of { q -> q.bool(BoolQuery.of { b -> b.should(languageQueries).minimumShouldMatch("1") }) }
                )
            }
        }

        if (!year.isNullOrBlank()) {
            filterQueries.add(
                Query.of { q -> q.match(MatchQuery.of { m -> m.field("year").query(year) }) }
            )
        }

        // Check if there's a query or filters
        val hasFilters = filterQueries.isNotEmpty()
        val hasQuery = normalizedQuery.isNotBlank()

        if (!hasQuery && !hasFilters) {
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

        val phraseBoostQueries = if (hasQuery) buildPhraseBoostQueries(normalizedQuery, searchableFields) else emptyList()

        // Build BoolQuery
        val boolQuery = BoolQuery.of { b -> b.apply {
            if (hasQuery) {
                val multiMatchMust: Query = Query.of { q ->
                    q.multiMatch(MultiMatchQuery.of { mm ->
                        mm.query(normalizedQuery)
                            .fields(searchableFields)
                            .operator(Operator.And)
                    })
                }
                must(multiMatchMust)
                if (phraseBoostQueries.isNotEmpty()) should(phraseBoostQueries)
            }
            if (filterQueries.isNotEmpty()) filter(filterQueries)
        } }

        val searchQuery = NativeQuery.builder()
            .withQuery(Query.of { q -> q.bool(boolQuery) })
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
                Query.of { q -> q.match(MatchQuery.of { match -> match.field(field).query(term).fuzziness("AUTO") }) },
                Query.of { q -> q.wildcard(WildcardQuery.of { wildcard -> wildcard.field(field).value(wildcardValue).caseInsensitive(true) }) }
            )
        }

        return Query.of { q -> q.bool(BoolQuery.of { b -> b.apply { should(fieldQueries); minimumShouldMatch("1") } }) }
    }

    private fun buildPhraseBoostQueries(query: String, fields: List<String>): List<Query> {
        if (!query.contains(' ')) {
            return emptyList()
        }

        return fields.map { field ->
            Query.of { q -> q.matchPhrase(MatchPhraseQuery.of { phrase -> phrase.field(field).query(query).slop(2) }) }
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
