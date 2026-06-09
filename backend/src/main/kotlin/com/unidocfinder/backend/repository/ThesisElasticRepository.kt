package com.unidocfinder.backend.repository

import com.unidocfinder.backend.domain.ThesisDocument

interface ThesisElasticRepository {
    fun searchThesis(query: String, page: Int, size: Int): List<ThesisDocument>
    fun save(entity: ThesisDocument): ThesisDocument
    fun saveAll(entities: List<ThesisDocument>): List<ThesisDocument>
}
