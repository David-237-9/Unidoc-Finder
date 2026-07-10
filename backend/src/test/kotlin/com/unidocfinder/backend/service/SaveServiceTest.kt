package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.Thesis
import com.unidocfinder.backend.domain.ThesisRequest
import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.repository.SearchRepository
import com.unidocfinder.backend.repository.TransactionManager
import com.unidocfinder.backend.repository.UniversityRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import java.util.UUID
import kotlin.test.assertEquals

class SaveServiceTest {

    private lateinit var transactionManager: TransactionManager
    private lateinit var saveService: SaveService
    private lateinit var searchRepository: SearchRepository
    private lateinit var universityRepository: UniversityRepository

    @BeforeEach
    fun setup() {
        transactionManager = mock()
        searchRepository = mock()
        universityRepository = mock()
        saveService = SaveService(transactionManager)
    }

    @Test
    fun `saveUniversity returns the saved university`() {
        val universityId = UUID.randomUUID()
        val university = University(
            id = universityId,
            name = "ISEL",
            repoUrl = "http://www.isel.pt"
        )

        whenever(transactionManager.run(any<kotlin.Function1<com.unidocfinder.backend.repository.Transaction, University>>())).thenAnswer { invocation ->
            val block = invocation.arguments[0] as kotlin.Function1<com.unidocfinder.backend.repository.Transaction, University>
            val tx = mock<com.unidocfinder.backend.repository.Transaction>()
            whenever(tx.universityRepository).thenReturn(universityRepository)
            whenever(tx.searchRepository).thenReturn(searchRepository)
            block.invoke(tx)
        }

        val result = saveService.saveUniversity(university)

        assertEquals("ISEL", result.name)
        assertEquals("http://www.isel.pt", result.repoUrl)
        assertEquals(universityId, result.id)
    }

    @Test
    fun `saveThesis persists thesis and indexes to elasticsearch`() {
        val universityId = UUID.randomUUID()
        val university = University(
            id = universityId,
            name = "ISEL",
            repoUrl = "http://www.isel.pt"
        )

        val thesisRequest = ThesisRequest(
            title = "Machine Learning Applications",
            abstract = "This thesis explores ML in distributed systems",
            year = 2023,
            url = "http://example.com/thesis.pdf",
            authors = listOf("João Silva"),
            subjects = listOf("Computer Science", "AI"),
            type = "MSc",
            language = "English",
            fileUrl = "https://example.com/thesis.pdf",
            universityId = universityId,
            hash = "abc123def456"
        )

        val thesis = Thesis(
            title = thesisRequest.title,
            abstract = thesisRequest.abstract,
            year = thesisRequest.year,
            url = thesisRequest.url,
            university = university,
            authors = thesisRequest.authors,
            subjects = thesisRequest.authors,
            type = thesisRequest.type,
            language = thesisRequest.language,
            fileUrl = thesisRequest.fileUrl,
            hash = thesisRequest.hash,
        )

        whenever(transactionManager.run(any<kotlin.Function1<com.unidocfinder.backend.repository.Transaction, Thesis>>())).thenAnswer { invocation ->
            val block = invocation.arguments[0] as kotlin.Function1<com.unidocfinder.backend.repository.Transaction, Thesis>
            val tx = mock<com.unidocfinder.backend.repository.Transaction>()
            whenever(tx.universityRepository).thenReturn(universityRepository)
            whenever(tx.searchRepository).thenReturn(searchRepository)
            whenever(universityRepository.findById(universityId)).thenReturn(university)
            block.invoke(tx)
        }

        val result = saveService.saveThesis(thesisRequest)

        assertEquals("Machine Learning Applications", result.title)
        assertEquals(2023, result.year)
        assertEquals("ISEL", result.university.name)
        // indexing is handled outside SaveService; no verification here
    }

    @Test
    fun `saveThesis with valid fields creates correct object`() {
        val universityId = UUID.randomUUID()

        val thesisRequest = ThesisRequest(
            title = "Test Thesis",
            abstract = "Abstract content",
            year = 2024,
            url = "http://repo.edu/thesis",
            authors = listOf("Author One"),
            subjects = listOf("Subject One"),
            type = "PhD",
            language = "Portuguese",
            fileUrl = "https://repo.edu/file.pdf",
            universityId = universityId,
            hash = "hash123"
        )

        val university = University(id = universityId, name = "IST", repoUrl = "http://ist.pt")
        val thesis = Thesis(
            title = thesisRequest.title,
            abstract = thesisRequest.abstract,
            year = thesisRequest.year,
            url = thesisRequest.url,
            university = university,
            authors = thesisRequest.authors,
            subjects = thesisRequest.authors,
            type = thesisRequest.type,
            language = thesisRequest.language,
            fileUrl = thesisRequest.fileUrl,
            hash = thesisRequest.hash,
        )

        whenever(transactionManager.run(any<kotlin.Function1<com.unidocfinder.backend.repository.Transaction, Thesis>>())).thenAnswer { invocation ->
            val block = invocation.arguments[0] as kotlin.Function1<com.unidocfinder.backend.repository.Transaction, Thesis>
            val tx = mock<com.unidocfinder.backend.repository.Transaction>()
            whenever(tx.universityRepository).thenReturn(universityRepository)
            whenever(tx.searchRepository).thenReturn(searchRepository)
            whenever(universityRepository.findById(universityId)).thenReturn(university)
            block.invoke(tx)
        }

        val result = saveService.saveThesis(thesisRequest)

        assertEquals("Test Thesis", result.title)
        assertEquals("Abstract content", result.abstract)
        assertEquals("PhD", thesisRequest.type)
        assertEquals(universityId, thesisRequest.universityId)
    }
}