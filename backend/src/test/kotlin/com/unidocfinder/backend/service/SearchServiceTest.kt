package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.ThesisDocument
import com.unidocfinder.backend.repository.ThesisElasticRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.whenever
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@ExtendWith(MockitoExtension::class)
class SearchServiceTest {

    @Mock
    private lateinit var thesisElasticRepository: ThesisElasticRepository

    private lateinit var searchService: SearchService

    @BeforeEach
    fun setUp() {
        searchService = SearchService(thesisElasticRepository)
    }

    @Test
    fun `search returns Success with results when query is found`() {
        val query = "AI"
        val page = 1
        val size = 10
        val thesisDocuments = listOf(
            ThesisDocument(
                id = "1",
                title = "AI Research",
                abstract = "Content about AI",
                year = "2023",
                url = "http://example.com",
                authors = listOf("John"),
                subjects = listOf("AI"),
                type = "PhD",
                language = "English",
                fileUrl = null,
                university = "ISEL"
            ), ThesisDocument(
                id = "2",
                title = "Machine Learning",
                abstract = "Content about ML",
                year = "2022",
                url = "http://example.com",
                authors = listOf("Jane"),
                subjects = listOf("ML"),
                type = "Masters",
                language = "English",
                fileUrl = null,
                university = "ISEL"


            )
        )

        whenever(thesisElasticRepository.searchThesis(query, page, size)).thenReturn(thesisDocuments)

        val result = searchService.search(query, page, size)

        assertTrue(result is Success)
        assertEquals(thesisDocuments, (result as Success).value)
    }

    @Test
    fun `search returns empty list when no results found`() {
        val query = "nonexistent"
        val page = 1
        val size = 10

        whenever(thesisElasticRepository.searchThesis(query, page, size)).thenReturn(emptyList())

        val result = searchService.search(query, page, size)

        assertTrue(result is Success)
        assertEquals(emptyList(), (result as Success).value)
    }

    @Test
    fun `search returns Failure when exception is thrown`() {
        val query = "test"
        val page = 1
        val size = 10

        whenever(
            thesisElasticRepository.searchThesis(
                query,
                page,
                size
            )
        ).thenThrow(RuntimeException("Connection failed"))

        val result = searchService.search(query, page, size)

        assertTrue(result is Failure)
        assertEquals(SearchError.SearchNotFound, (result as Failure).value)
    }

    @Test
    fun `search coerces page to minimum value of 1`() {
        val query = "test"
        val page = 0
        val size = 10
        val thesisDocuments = emptyList<ThesisDocument>()

        whenever(thesisElasticRepository.searchThesis(query, 1, size)).thenReturn(thesisDocuments)

        val result = searchService.search(query, page, size)

        assertTrue(result is Success)
    }

    @Test
    fun `search coerces size to maximum value of 100`() {
        val query = "test"
        val page = 1
        val size = 150
        val thesisDocuments = emptyList<ThesisDocument>()

        whenever(thesisElasticRepository.searchThesis(query, page, 100)).thenReturn(thesisDocuments)

        val result = searchService.search(query, page, size)

        assertTrue(result is Success)
    }

    @Test
    fun `search enforces minimum size of 1`() {
        val query = "test"
        val page = 1
        val size = 0
        val thesisDocuments = emptyList<ThesisDocument>()

        whenever(thesisElasticRepository.searchThesis(query, page, 1)).thenReturn(thesisDocuments)

        val result = searchService.search(query, page, size)

        assertTrue(result is Success)
    }
}
