package com.unidocfinder.backend.jdbi

import com.unidocfinder.backend.domain.Thesis
import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.repository.SearchRepository
import org.jdbi.v3.core.Handle
import java.util.*

class SearchRepositoryJdbi(private val handle: Handle) : SearchRepository {
    override fun search(query: String, page: Int, size: Int): List<Thesis> {
        val offset = (page - 1) * size
        return handle.createQuery(
            """
            SELECT t.id, t.title, t.abstract, t.year, t.url, t.authors, t.subjects, t.type, t.language, t.file_url,
                   u.id as u_id, u.name as u_name, u.repo_url as u_repo_url
            FROM thesis t
            JOIN university u ON t.university_id = u.id
            WHERE t.title ILIKE :query OR t.abstract ILIKE :query
            LIMIT :size OFFSET :offset
            """.trimIndent()
        ).bind("query", "%$query%").bind("size", size).bind("offset", offset).map { rs, _ ->
            Thesis(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                authors = rs.getArray("authors").toStringList(),
                subjects = rs.getArray("subjects").toStringList(),
                type = rs.getString("type"),
                language = rs.getString("language"),
                fileUrl = rs.getString("file_url"),
                university = University(
                    id = UUID.fromString(rs.getString("u_id")),
                    name = rs.getString("u_name"),
                    repoUrl = rs.getString("u_repo_url")
                )
            )
        }.list()
    }

    override fun findById(id: UUID): Thesis? {
        return handle.createQuery(
            """
            SELECT t.id, t.title, t.abstract, t.year, t.url, t.authors, t.subjects, t.type, t.language, t.file_url,
                   u.id as u_id, u.name as u_name, u.repo_url as u_repo_url
            FROM thesis t
            JOIN university u ON t.university_id = u.id
            WHERE t.id = :id::uuid
            """.trimIndent()
        ).bind("id", id.toString()).map { rs, _ ->
            Thesis(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                authors = rs.getArray("authors").toStringList(),
                subjects = rs.getArray("subjects").toStringList(),
                type = rs.getString("type"),
                language = rs.getString("language"),
                fileUrl = rs.getString("file_url"),
                university = University(
                    id = UUID.fromString(rs.getString("u_id")),
                    name = rs.getString("u_name"),
                    repoUrl = rs.getString("u_repo_url")
                )
            )
        }.findOne().orElse(null)
    }

    override fun findAll(
        page: Int, size: Int
    ): List<Thesis> {
        val offset = (page - 1) * size
        return handle.createQuery(
            """
            SELECT t.id, t.title, t.abstract, t.year, t.url, t.authors, t.subjects, t.type, t.language, t.file_url,
                   u.id as u_id, u.name as u_name, u.repo_url as u_repo_url
            FROM thesis t
            JOIN university u ON t.university_id = u.id
            LIMIT :size OFFSET :offset
            """.trimIndent()
        ).bind("size", size).bind("offset", offset).map { rs, _ ->
            Thesis(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                authors = rs.getArray("authors").toStringList(),
                subjects = rs.getArray("subjects").toStringList(),
                type = rs.getString("type"),
                language = rs.getString("language"),
                fileUrl = rs.getString("file_url"),
                university = University(
                    id = UUID.fromString(rs.getString("u_id")),
                    name = rs.getString("u_name"),
                    repoUrl = rs.getString("u_repo_url")
                )
            )
        }.list()
    }

    override fun save(entity: Thesis) {
        handle.createUpdate(
            """
            INSERT INTO thesis (id, title, abstract, year, url, authors, subjects, type, language, file_url, university_id)
            VALUES (:id::uuid, :title, :abstract, :year, :url, :authors, :subjects, :type, :language, :fileUrl, :universityId::uuid)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                abstract = EXCLUDED.abstract,
                year = EXCLUDED.year,
                url = EXCLUDED.url,
                authors = EXCLUDED.authors,
                subjects = EXCLUDED.subjects,
                type = EXCLUDED.type,
                language = EXCLUDED.language,
                file_url = EXCLUDED.file_url,
                university_id = EXCLUDED.university_id
            """
        ).bind("id", entity.id.toString()).bind("title", entity.title).bind("abstract", entity.abstract)
            .bind("year", entity.year).bind("url", entity.url).bindArray("authors", String::class.java, entity.authors)
            .bindArray("subjects", String::class.java, entity.subjects).bind("type", entity.type)
            .bind("language", entity.language).bind("fileUrl", entity.fileUrl)
            .bind("universityId", entity.university.id.toString())
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

    fun searchWithUniversity(query: String, page: Int, size: Int): List<Thesis> {
        val offset = (page - 1) * size
        return handle.createQuery(
            """
            SELECT t.id, t.title, t.abstract, t.year, t.url, t.authors, t.subjects, t.type, t.language, t.file_url,
                   u.id as u_id, u.name as u_name, u.repo_url as u_repo_url
            FROM thesis t
            JOIN university u ON t.university_id = u.id
            WHERE t.title ILIKE :query OR t.abstract ILIKE :query
            LIMIT :size OFFSET :offset
            """.trimIndent()
        ).bind("query", "%$query%").bind("size", size).bind("offset", offset).map { rs, _ ->
            Thesis(
                id = UUID.fromString(rs.getString("id")),
                title = rs.getString("title"),
                abstract = rs.getString("abstract"),
                year = rs.getInt("year"),
                url = rs.getString("url"),
                authors = rs.getArray("authors").toStringList(),
                subjects = rs.getArray("subjects").toStringList(),
                type = rs.getString("type"),
                language = rs.getString("language"),
                fileUrl = rs.getString("file_url"),
                university = University(
                    id = UUID.fromString(rs.getString("u_id")),
                    name = rs.getString("u_name"),
                    repoUrl = rs.getString("u_repo_url")
                )
            )
        }.list()
    }

}

private fun java.sql.Array?.toStringList(): List<String> {
    val values = this?.array as? Array<*> ?: return emptyList()
    return values.filterIsInstance<String>()
}
