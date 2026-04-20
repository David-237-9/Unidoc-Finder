package com.unidocfinder.backend.repository

import java.util.UUID

interface Repository<T> {
    fun findById(id: UUID): T? // Find an entity by its ID

    fun findAll(page: Int, size: Int): List<T> // Retrieve all entities

    fun save(entity: T) // Save a new or existing entity

    fun deleteById(id: UUID) // Delete an entity by its ID

    fun clear() // Delete all entries
}