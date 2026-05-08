package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.Thesis
import com.unidocfinder.backend.domain.ThesisRequest
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

    fun saveThesis(request: ThesisRequest): Thesis {
        return transactionManager.run {
            // Get the existing university by ID
            val university = universityRepository.findById(request.universityId)
                ?: throw IllegalArgumentException("University with ID ${request.universityId} not found")

            // Create thesis with the existing university
            val thesis = Thesis(
                title = request.title,
                abstract = request.abstract,
                year = request.year,
                url = request.url,
                university = university
            )

            searchRepository.save(thesis)
            thesis
        }
    }
}
