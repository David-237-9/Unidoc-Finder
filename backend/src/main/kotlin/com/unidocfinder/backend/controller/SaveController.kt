package com.unidocfinder.backend.controller

import com.unidocfinder.backend.domain.Search
import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.service.SaveService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class SaveController(private val saveService: SaveService) {

    @PostMapping("/universities")
    fun createUniversity(@RequestBody university: University): ResponseEntity<*> {
        return try {
            val result = saveService.saveUniversity(university)
            ResponseEntity.status(HttpStatus.CREATED).body(result)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to (e.message ?: "Failed to create university")))
        }
    }

    @PostMapping("/thesis")
    fun createThesis(@RequestBody thesis: Search): ResponseEntity<*> {
        return try {
            val result = saveService.saveThesis(thesis)
            ResponseEntity.status(HttpStatus.CREATED).body(result)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to (e.message ?: "Failed to create thesis")))
        }
    }
}