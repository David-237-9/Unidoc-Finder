package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.Search
import com.unidocfinder.backend.domain.SearchResult
import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.repository.TransactionManager
import jakarta.inject.Named

@Named
class SaveService(private val transactionManager: TransactionManager) {
    fun saveUniversity(university: University): University {
        return transactionManager.run {
            universityRepository.save(university)
            university
        }
    }

    fun saveThesis(thesis: Search): SearchResult {
        return transactionManager.run {
            // Validate that the university exists
            val university = universityRepository.findById(thesis.universityId)
                ?: throw IllegalArgumentException("University with ID ${thesis.universityId} not found")

            searchRepository.save(thesis)

            SearchResult(
                id = thesis.id,
                title = thesis.title,
                abstract = thesis.abstract,
                year = thesis.year,
                url = thesis.url,
                university = university
            )
        }
    }
}
