package com.unidocfinder.backend.jdbi

import com.unidocfinder.backend.domain.Search
import com.unidocfinder.backend.repository.SearchRepository
import org.jdbi.v3.core.Handle
import java.util.*
import javax.management.Query

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
                university = UniversityRepositoryJdbi(handle).findById(
                    UUID.fromString(
                        rs.getString("universityId")
                    )
                )!!
            )
        }.list()
    }

    override fun findById(id: UUID): Search? {
        return handle.createQuery(
        """
        SELECT * FROM thesis
        WHERE id = :id
        """.trimIndent()
        ).bind("id", id.toString()).map { rs, _ ->
            Search(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                university = UniversityRepositoryJdbi(handle).findById(
                    UUID.fromString(
                        rs.getString("universityId")
                    )
                )!!
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
                university = UniversityRepositoryJdbi(handle).findById(
                    UUID.fromString(
                        rs.getString("universityId")
                    )
                )!!
            )
        }.list()
    }

    override fun save(entity: Search) {
        handle.createUpdate(
            """
            INSERT INTO thesis (id, title, abstract, year, url, universityId)
            VALUES (:id, :title, :abstract, :year, :url, :universityId)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                abstract = EXCLUDED.abstract,
                year = EXCLUDED.year,
                url = EXCLUDED.url,
           """
        )
            .bind("id", entity.id)
            .bind("title", entity.title)
            .bind("abstract", entity.abstract)
            .bind("year", entity.year)
            .bind("url", entity.url)
            .bind("universityId", entity.university.id)
            .execute()
    }

    override fun deleteById(id: UUID) {
        handle.createUpdate(
            """
            DELETE FROM thesis WHERE id = :id
            """
        )
            .bind("id", id)
            .execute()
    }

    override fun clear() {
        handle.createUpdate(
            """
            DELETE FROM thesis
            """
        ).execute()
    }

}