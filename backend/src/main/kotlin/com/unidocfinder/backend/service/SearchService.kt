package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.ThesisDocument
import com.unidocfinder.backend.repository.ThesisElasticRepository
import jakarta.inject.Named

sealed class SearchError {
    data object SearchNotFound : SearchError()
}

@Named
class SearchService(private val thesisElasticRepository: ThesisElasticRepository) {
    fun search(
        query: String,
        page: Int,
        size: Int,
        university: String? = null,
        type: String? = null,
        author: String? = null,
        subject: String? = null,
        language: String? = null,
        year: String? = null
    ): Either<SearchError, List<ThesisDocument>> {
        return try {
            val safePage = page.coerceAtLeast(1)
            val safeSize = size.coerceIn(1, 100)
            val searchResult = thesisElasticRepository.searchThesis(query, safePage, safeSize, university, type, author, subject, language, year)

            Success(searchResult)
        } catch (e: Exception) {
            e.printStackTrace()
            Failure(SearchError.SearchNotFound)
        }
    }
}
