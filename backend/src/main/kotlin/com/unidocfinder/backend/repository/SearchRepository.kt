package com.unidocfinder.backend.repository

import com.unidocfinder.backend.domain.Thesis
import jakarta.inject.Named
import javax.management.Query

@Named
interface SearchRepository : Repository<Thesis>{
    fun search(query: String, page: Int, size: Int): List<Thesis>
    fun existsByHash(hash: String): Boolean
}