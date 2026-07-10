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
    val authors: List<String>,
    val subjects: List<String>,
    val type: String,
    val language: String,
    val fileUrl: String?,
    val university: String,
    val hash: String?,
)