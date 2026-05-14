package com.unidocfinder.backend.elasticsearch

import co.elastic.clients.elasticsearch._types.query_dsl.Query
import com.unidocfinder.backend.domain.ThesisDocument
import com.unidocfinder.backend.repository.ThesisElasticRepository
import org.springframework.data.elasticsearch.client.elc.NativeQuery
import org.springframework.data.elasticsearch.core.ElasticsearchOperations
import org.springframework.data.elasticsearch.core.SearchHits
import org.springframework.stereotype.Repository

@Repository
class ThesisElasticRepositoryImpl(
    private val elasticsearchOperations: ElasticsearchOperations
) : ThesisElasticRepository {

    override fun searchThesis(query: String): List<ThesisDocument> {
        if (query.isBlank()) {
            return emptyList()
        }

        val wildcardQuery = "*${query.lowercase()}*"

        val searchQuery = NativeQuery.builder()
            .withQuery(
                Query.of { q ->
                    q.bool { b ->
                        b.should(
                            Query.of { it ->
                                it.wildcard { wc ->
                                    wc.field("title").value(wildcardQuery).caseInsensitive(true)
                                }
                            },
                            Query.of { it ->
                                it.wildcard { wc ->
                                    wc.field("abstract").value(wildcardQuery).caseInsensitive(true)
                                }
                            }
                        )
                    }
                }
            ).build()

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