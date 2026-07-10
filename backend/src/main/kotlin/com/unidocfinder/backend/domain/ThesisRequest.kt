package com.unidocfinder.backend.domain

import java.util.UUID

data class ThesisRequest(
    val id: UUID = UUID.randomUUID(),
    val title: String,
    val abstract: String,
    val year: Int,
    val url: String,
    val authors: List<String>,
    val subjects: List<String>,
    val type: String,
    val language: String,
    val fileUrl: String?,
    val universityId: UUID,
    val hash: String,
)