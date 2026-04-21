package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.Search
import com.unidocfinder.backend.repository.TransactionManager
import jakarta.inject.Named



sealed class SearchError {
    data object SearchNotFound : SearchError()
}

@Named
class SearchService(private val transactionManager: TransactionManager) {
    fun search(query: String, page: Int, size: Int): Either<SearchError, List<Search>> {
        return transactionManager.run {
            val searchResult = searchRepository.search(query, page, size)
            success(searchResult)
        }
    }
}