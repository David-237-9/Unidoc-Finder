package com.unidocfinder.backend.jdbi

import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.repository.UniversityRepository
import org.jdbi.v3.core.Handle
import java.util.*

class UniversityRepositoryJdbi(private val handle: Handle) : UniversityRepository {
    override fun findById(id: UUID): University? {
        return handle.createQuery(
            """
            SELECT * FROM university
            WHERE id = :id
            """.trimIndent()
        ).bind("id", id.toString()).map { rs, _ ->
            University(
                id = UUID.fromString(rs.getString("id")),
                name = rs.getString("name"),
                repoUrl = rs.getString("repo_url")
            )
        }.findOne().orElse(null)
    }

    override fun findAll(
        page: Int, size: Int
    ): List<University> {
        val offset = (page - 1) * size
        return handle.createQuery(
            """
            SELECT * FROM university
            LIMIT :size OFFSET :offset
            """.trimIndent()
        ).bind("size", size).bind("offset", offset).map { rs, _ ->
            University(
                id = UUID.fromString(rs.getString("id")),
                name = rs.getString("name"),
                repoUrl = rs.getString("repo_url")
            )
        }.list()
    }

    override fun save(entity: University) {
        handle.createUpdate(
            """
            INSERT INTO university (id, name, repo_url)
            VALUES (:id, :name, :repo_url)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                repo_url = EXCLUDED.repo_url
            """
        )
            .bind("id", entity.id)
            .bind("name", entity.name)
            .bind("repo_url", entity.repoUrl)
            .execute()
    }

    override fun deleteById(id: UUID) {
        handle.createUpdate(
            """
            DELETE FROM university WHERE id = :id
            """
        )
            .bind("id", id)
            .execute()
    }

    override fun clear() {
        handle.createUpdate(
            """
            DELETE FROM university
            """
        ).execute()
    }
}