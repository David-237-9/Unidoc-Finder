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
        if (query.isBlank()) {
            return emptyList()
        }

        val wildcardQuery = "*${query.lowercase()}*"
        val searchableFields = listOf(
            "title",
            "abstract",
            "authors",
            "subjects",
            "type",
            "language",
            "university"
        )
        val shouldQueries = searchableFields.map { field ->
            Query.of { q ->
                q.wildcard { wildcard ->
                    wildcard.field(field).value(wildcardQuery).caseInsensitive(true)
                }
            }
        }

        val searchQuery = NativeQuery.builder()
            .withQuery(
                Query.of { q ->
                    q.bool { bool ->
                        bool.should(shouldQueries)
                        bool.minimumShouldMatch("1")
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
}
