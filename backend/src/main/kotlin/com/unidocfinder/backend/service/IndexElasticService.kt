package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.Thesis
import com.unidocfinder.backend.domain.ThesisDocument
import com.unidocfinder.backend.repository.SearchRepository
import com.unidocfinder.backend.repository.ThesisElasticRepository
import com.unidocfinder.backend.repository.TransactionManager
import jakarta.inject.Named
import org.slf4j.LoggerFactory

@Named
class IndexElasticService(
    private val thesisElasticRepository: ThesisElasticRepository,
    private val transactionManager: TransactionManager
) {
    private val logger = LoggerFactory.getLogger(IndexElasticService::class.java)

    fun indexThesis(thesis: Thesis) {
        try {
            val document = ThesisDocument(
                id = thesis.id.toString(),
                title = thesis.title,
                abstract = thesis.abstract,
                year = thesis.year.toString(),
                url = thesis.url,
                authors = thesis.authors,
                subjects = thesis.subjects,
                type = thesis.type,
                language = thesis.language,
                fileUrl = thesis.fileUrl,
                university = thesis.university.name,
                hash = thesis.hash
            )
            thesisElasticRepository.save(document)
            logger.info("Indexed thesis with ID: ${thesis.id}")
        } catch (e: Exception) {
            logger.error("Failed to index thesis with ID: ${thesis.id}", e)
        }
    }

    fun syncAllThesesFromPostgres() {
        return transactionManager.run {
            logger.info("Starting to sync all theses from Postgres to Elasticsearch")

            // Get all theses from Postgres
            val allTheses = searchRepository.findAll(1, Int.MAX_VALUE)

            val documents = allTheses.map { thesis ->
                ThesisDocument(
                    id = thesis.id.toString(),
                    title = thesis.title,
                    abstract = thesis.abstract,
                    year = thesis.year.toString(),
                    url = thesis.url,
                    authors = thesis.authors,
                    subjects = thesis.subjects,
                    type = thesis.type,
                    language = thesis.language,
                    fileUrl = thesis.fileUrl,
                    university = thesis.university.name,
                    hash = thesis.hash
                )
            }

            if (documents.isNotEmpty()) {
                thesisElasticRepository.saveAll(documents)
                logger.info("Successfully synced ${documents.size} theses to Elasticsearch")
            }
        }
    }
}
