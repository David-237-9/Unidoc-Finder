package com.unidocfinder.backend.jdbi

import com.unidocfinder.backend.domain.Search
import com.unidocfinder.backend.domain.SearchResult
import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.repository.SearchRepository
import org.jdbi.v3.core.Handle
import java.util.*

class SearchRepositoryJdbi(private val handle: Handle) : SearchRepository {
    override fun search(query: String, page: Int, size: Int): List<Search> {
        val offset = (page - 1) * size
        return handle.createQuery(
            """
            SELECT * FROM thesis
            WHERE title ILIKE :query OR abstract ILIKE :query
            LIMIT :size OFFSET :offset
            """.trimIndent()
        ).bind("query", "%$query%").bind("size", size).bind("offset", offset).map { rs, _ ->
            Search(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                universityId = UUID.fromString(rs.getString("university_id"))
            )
        }.list()
    }

    override fun findById(id: UUID): Search? {
        return handle.createQuery(
            """
        SELECT * FROM thesis
        WHERE id = :id::uuid
        """.trimIndent()
        ).bind("id", id.toString()).map { rs, _ ->
            Search(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                universityId = UUID.fromString(rs.getString("university_id"))
            )
        }.findOne().orElse(null)
    }

    override fun findAll(
        page: Int, size: Int
    ): List<Search> {
        val offset = (page - 1) * size
        return handle.createQuery(
            """
        SELECT * FROM thesis
        LIMIT :size OFFSET :offset
        """.trimIndent()
        ).bind("size", size).bind("offset", offset).map { rs, _ ->
            Search(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                universityId = UUID.fromString(rs.getString("university_id"))
            )
        }.list()
    }

    override fun save(entity: Search) {
        handle.createUpdate(
            """
            INSERT INTO thesis (id, title, abstract, year, url, university_id)
            VALUES (:id::uuid, :title, :abstract, :year, :url, :universityId::uuid)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                abstract = EXCLUDED.abstract,
                year = EXCLUDED.year,
                url = EXCLUDED.url,
                university_id = EXCLUDED.university_id
            """
        ).bind("id", entity.id.toString()).bind("title", entity.title).bind("abstract", entity.abstract)
            .bind("year", entity.year).bind("url", entity.url).bind("universityId", entity.universityId.toString())
            .execute()
    }

    override fun deleteById(id: UUID) {
        handle.createUpdate(
            """
            DELETE FROM thesis WHERE id = :id::uuid
            """
        ).bind("id", id.toString()).execute()
    }

    override fun clear() {
        handle.createUpdate(
            """
            DELETE FROM thesis
            """
        ).execute()
    }

    fun searchWithUniversity(query: String, page: Int, size: Int): List<SearchResult> {
        val offset = (page - 1) * size
        return handle.createQuery(
            """
            SELECT t.id, t.title, t.abstract, t.year, t.url, t.university_id,
                   u.id as u_id, u.name as u_name, u.repo_url as u_repo_url
            FROM thesis t
            JOIN university u ON t.university_id = u.id
            WHERE t.title ILIKE :query OR t.abstract ILIKE :query
            LIMIT :size OFFSET :offset
            """.trimIndent()
        ).bind("query", "%$query%").bind("size", size).bind("offset", offset).map { rs, _ ->
            SearchResult(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                university = University(
                    id = UUID.fromString(rs.getString("u_id")),
                    name = rs.getString("u_name"),
                    repoUrl = rs.getString("u_repo_url")
                )
            )
        }.list()
    }

}