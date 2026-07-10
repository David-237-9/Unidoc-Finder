package com.unidocfinder.backend.controller

import com.unidocfinder.backend.domain.Thesis
import com.unidocfinder.backend.domain.ThesisRequest
import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.service.SaveService
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.whenever
import org.springframework.http.HttpStatus
import java.util.UUID
import kotlin.test.assertEquals

@ExtendWith(MockitoExtension::class)
class SaveControllerTest {

    @Mock
    private lateinit var saveService: SaveService

    private lateinit var saveController: SaveController

    @BeforeEach
    fun setUp() {
        saveController = SaveController(saveService)
    }

    @Test
    fun `createUniversity returns CREATED with university data`() {
        val university = University(id = UUID.randomUUID(), name = "ISEL", repoUrl = "http://example.com")

        whenever(saveService.saveUniversity(university)).thenReturn(university)

        val response = saveController.createUniversity(university)

        assertEquals(HttpStatus.CREATED, response.statusCode)
        assertEquals(university, response.body)
    }

    @Test
    fun `createUniversity returns INTERNAL_SERVER_ERROR on exception`() {
        val university = University(id = UUID.randomUUID(), name = "ISEL", repoUrl = "http://example.com")

        whenever(saveService.saveUniversity(university)).thenThrow(RuntimeException("Database error"))

        val response = saveController.createUniversity(university)

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
    }

    @Test
    fun `createThesis returns CREATED with thesis data`() {
        val universityId = UUID.randomUUID()
        val university = University(id = universityId, name = "ISEL", repoUrl = "http://example.com")
        val thesisRequest = ThesisRequest(
            title = "Test Test",
            abstract = "This is a Test Abstract",
            year = 2023,
            url = "http://www.isel.pt",
            authors = listOf("Nuno", "David"),
            subjects = listOf("Computer Science"),
            type = "PhD",
            language = "English",
            fileUrl = "https://pdfobject.com/pdf/sample.pdf",
            universityId = universityId,
            hash = "sample-hash"
        )
        val thesis = Thesis(
            title = thesisRequest.title,
            abstract = thesisRequest.abstract,
            year = thesisRequest.year,
            url = thesisRequest.url,
            authors = thesisRequest.authors,
            subjects = thesisRequest.subjects,
            type = thesisRequest.type,
            language = thesisRequest.language,
            fileUrl = thesisRequest.fileUrl,
            university = university,
            hash = thesisRequest.hash
        )

        whenever(saveService.saveThesis(thesisRequest)).thenReturn(thesis)

        val response = saveController.createThesis(thesisRequest)

        assertEquals(HttpStatus.CREATED, response.statusCode)
        assertEquals(thesis, response.body)
    }

    @Test
    fun `createThesis returns INTERNAL_SERVER_ERROR when university not found`() {
        val universityId = UUID.randomUUID()
        val thesisRequest = ThesisRequest(
            title = "Test Test",
            abstract = "This is a Test Abstract",
            year = 2023,
            url = "http://www.isel.pt",
            authors = listOf("Nuno", "David"),
            subjects = listOf("Computer Science"),
            type = "PhD",
            language = "English",
            fileUrl = "https://pdfobject.com/pdf/sample.pdf",
            universityId = universityId,
            hash = "sample-hash"
        )

        whenever(saveService.saveThesis(thesisRequest)).thenThrow(
            IllegalArgumentException("University with ID $universityId not found")
        )

        val response = saveController.createThesis(thesisRequest)

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
    }

    @Test
    fun `createThesis returns INTERNAL_SERVER_ERROR on general exception`() {
        val universityId = UUID.randomUUID()
        val thesisRequest = ThesisRequest(
            title = "Test Test",
            abstract = "This is a Test Abstract",
            year = 2023,
            url = "http://www.isel.pt",
            authors = listOf("Nuno", "David"),
            subjects = listOf("Computer Science"),
            type = "PhD",
            language = "English",
            fileUrl = "https://pdfobject.com/pdf/sample.pdf",
            universityId = universityId,
            hash = "sample-hash"
        )

        whenever(saveService.saveThesis(thesisRequest)).thenThrow(RuntimeException("Database error"))

        val response = saveController.createThesis(thesisRequest)

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
    }
}
