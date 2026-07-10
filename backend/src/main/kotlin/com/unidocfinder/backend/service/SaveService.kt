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

    fun listUniversities(page: Int = 1, size: Int = 100): List<University> {
        return transactionManager.run {
            val safePage = page.coerceAtLeast(1)
            val safeSize = size.coerceIn(1, 1000)
            universityRepository.findAll(safePage, safeSize)
        }
    }

    fun thesisExists(hash: String): Boolean {
        return transactionManager.run {
            searchRepository.existsByHash(hash)
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
                authors = request.authors,
                subjects = request.subjects,
                type = request.type,
                language = request.language,
                fileUrl = request.fileUrl,
                university = university,
                hash = request.hash
            )

            searchRepository.save(thesis)
            thesis
        }
    }
}
