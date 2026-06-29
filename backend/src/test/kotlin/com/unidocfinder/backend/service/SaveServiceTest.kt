package com.unidocfinder.backend.service

import com.unidocfinder.backend.domain.ThesisRequest
import com.unidocfinder.backend.domain.University
import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals

class SaveServiceTest {

    @Test
    fun `saveUniversity returns the saved university`() {
        val university = University(
            id = UUID.randomUUID(),
            name = "ISEL",
            repoUrl = "http://www.isel.pt"
        )

        assertEquals("ISEL", university.name)
        assertEquals("http://www.isel.pt", university.repoUrl)
    }

    @Test
    fun `saveThesis returns thesis with existing university when found`() {
        val universityId = UUID.randomUUID()
        val university = University(
            id = universityId,
            name = "ISEL",
            repoUrl = "http://www.isel.pt"
        )

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
            universityId = universityId
        )

        assertEquals("Test Test", thesisRequest.title)
        assertEquals(2023, thesisRequest.year)
        assertEquals(universityId, thesisRequest.universityId)
    }

    @Test
    fun `saveThesis validates required fields`() {
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
            universityId = universityId
        )

        assertEquals("Test Test", thesisRequest.title)
        assertEquals("This is a Test Abstract", thesisRequest.abstract)
        assertEquals("PhD", thesisRequest.type)
    }

    @Test
    fun `saveUniversity preserves university properties`() {
        val universityId = UUID.randomUUID()
        val university = University(
            id = universityId,
            name = "ISEL",
            repoUrl = "http://www.isel.pt"
        )

        assertEquals(universityId, university.id)
        assertEquals("ISEL", university.name)
        assertEquals("http://www.isel.pt", university.repoUrl)
    }
}