package com.unidocfinder.backend.controller

import com.unidocfinder.backend.domain.ThesisDocument
import com.unidocfinder.backend.service.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.whenever
import org.springframework.http.HttpStatus
import kotlin.test.assertEquals

@ExtendWith(MockitoExtension::class)
class SearchControllerTest {

    @Mock
    private lateinit var searchService: SearchService

    @Mock
    private lateinit var indexElasticService: IndexElasticService

    private lateinit var searchController: SearchController

    @BeforeEach
    fun setUp() {
        searchController = SearchController(searchService, indexElasticService)
    }

    @Test
    fun `search returns OK with results when query is successful`() {
        val thesisDocuments = listOf(
            ThesisDocument(
                id = "1",
                title = "Test Thesis",
                abstract = "Abstract about the thesis",
                year = "2023",
                url = "http://www.isel.pt",
                authors = listOf("John Doe"),
                subjects = listOf("AI", "ML"),
                type = "PhD",
                language = "English",
                fileUrl = "https://pdfobject.com/pdf/sample.pdf",
                university = "ISEL"
            )
        )

        whenever(searchService.search("Thesis", 1, 10, null, null, null, null, null, null)).thenReturn(Success(thesisDocuments))

        val response = searchController.search("Thesis", 1, 10)

        assertEquals(HttpStatus.OK, response.statusCode)
    }

    @Test
    fun `search returns INTERNAL_SERVER_ERROR when service fails`() {
        whenever(searchService.search("invalid", 1, 10, null, null, null, null, null, null)).thenReturn(Failure(SearchError.SearchNotFound))

        val response = searchController.search("invalid", 1, 10)

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
    }

    @Test
    fun `search uses default pagination values`() {
        val thesis = emptyList<ThesisDocument>()
        whenever(searchService.search("test", 1, 10, null, null, null, null, null, null)).thenReturn(Success(thesis))

        val response = searchController.search("test", 1, 10)

        assertEquals(HttpStatus.OK, response.statusCode)
    }

    @Test
    fun `syncPostgresToElasticsearch returns OK on success`() {
        val response = searchController.syncPostgresToElasticsearch()

        assertEquals(HttpStatus.OK, response.statusCode)
    }

    @Test
    fun `syncPostgresToElasticsearch returns INTERNAL_SERVER_ERROR on exception`() {
        whenever(indexElasticService.syncAllThesesFromPostgres()).thenThrow(RuntimeException("Sync failed"))

        val response = searchController.syncPostgresToElasticsearch()

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
    }
}

