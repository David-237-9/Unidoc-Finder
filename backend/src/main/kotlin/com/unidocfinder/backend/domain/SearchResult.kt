package com.unidocfinder.backend.domain

import java.util.UUID

data class SearchResult (
    val id: UUID,
    val title: String,
    val abstract: String,
    val year: Int,
    val url: String,
    val university: University,
)
