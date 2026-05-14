package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.ThesisDocument
import com.unidocfinder.backend.repository.ThesisElasticRepository
import jakarta.inject.Named

sealed class SearchError {
    data object SearchNotFound : SearchError()
}

@Named
class SearchService(private val thesisElasticRepository: ThesisElasticRepository) {
    fun search(query: String, page: Int, size: Int): Either<SearchError, List<ThesisDocument>> {
        return try {
            val searchResult = thesisElasticRepository.searchThesis(query)
                .drop((page - 1) * size)
                .take(size)

            Success(searchResult)
        } catch (e: Exception) {
            e.printStackTrace()
            Failure(SearchError.SearchNotFound)
        }
    }
}