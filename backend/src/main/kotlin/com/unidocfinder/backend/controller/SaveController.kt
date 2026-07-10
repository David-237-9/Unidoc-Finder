package com.unidocfinder.backend.controller

import com.unidocfinder.backend.domain.ThesisRequest
import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.service.SaveService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class SaveController(private val saveService: SaveService) {

    @GetMapping("/universities")
    fun listUniversities(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "100") size: Int
    ): ResponseEntity<*> {
        return try {
            val result = saveService.listUniversities(page, size)
            ResponseEntity.ok(result)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to (e.message ?: "Failed to list universities")))
        }
    }

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
    fun createThesis(@RequestBody request: ThesisRequest): ResponseEntity<*> {
        return try {
            val result = saveService.saveThesis(request)
            ResponseEntity.status(HttpStatus.CREATED).body(result)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to (e.message ?: "Failed to create thesis")))
        }
    }

    @GetMapping("/thesis/exists")
    fun thesisExists(@RequestParam hash: String): ResponseEntity<*> {
        return try {
            ResponseEntity.ok(saveService.thesisExists(hash))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to (e.message ?: "Failed to check thesis hash")))
        }
    }
}
