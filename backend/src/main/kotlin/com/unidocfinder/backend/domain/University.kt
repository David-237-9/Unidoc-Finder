package com.unidocfinder.backend.domain

import java.util.UUID

data class University (
    val id: UUID = UUID.randomUUID(),
    val name: String,
    val repoUrl: String,
)