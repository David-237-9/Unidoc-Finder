package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.SearchResult
import com.unidocfinder.backend.repository.TransactionManager
import jakarta.inject.Named


sealed class SearchError {
    data object SearchNotFound : SearchError()
}

@Named
class SearchService(private val transactionManager: TransactionManager) {
    fun search(query: String, page: Int, size: Int): Either<SearchError, List<SearchResult>> {
        return transactionManager.run {
            val searchResult =
                (searchRepository as com.unidocfinder.backend.jdbi.SearchRepositoryJdbi).searchWithUniversity(
                    query,
                    page,
                    size
                )
            success(searchResult)
        }
    }
}