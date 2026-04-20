package com.unidocfinder.backend.repository

import com.unidocfinder.backend.domain.Search
import jakarta.inject.Named
import javax.management.Query

@Named
interface SearchRepository : Repository<Search>{
    fun search(query: Query): List<Search>
}