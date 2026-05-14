package com.unidocfinder.backend.domain

import org.springframework.data.annotation.Id
import org.springframework.data.elasticsearch.annotations.Document

@Document(indexName = "thesis")
data class ThesisDocument(
    @Id
    val id: String,
    val title: String,
    val abstract: String,
    val year: String,
    val url: String,
    val university: String,
)