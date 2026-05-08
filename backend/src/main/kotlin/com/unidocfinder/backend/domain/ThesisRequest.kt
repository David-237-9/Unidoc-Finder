package com.unidocfinder.backend.domain

import java.util.UUID

data class ThesisRequest(
    val id: UUID = UUID.randomUUID(),
    val title: String,
    val abstract: String,
    val year: Int,
    val url: String,
    val universityId: UUID,
)