package com.unidocfinder.backend.controller

import com.unidocfinder.backend.service.Failure
import com.unidocfinder.backend.service.IndexElasticService
import com.unidocfinder.backend.service.SearchService
import com.unidocfinder.backend.service.Success
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController


@RestController
@RequestMapping("/api/search")
class SearchController(
    private val searchService: SearchService,
    private val indexElasticService: IndexElasticService
) {

    @GetMapping
    fun search(
        @RequestParam(value = "query", required = true) query: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @RequestParam(required = false) university: String? = null,
        @RequestParam(required = false) type: List<String>? = null,
        @RequestParam(required = false) author: String? = null,
        @RequestParam(required = false) subject: List<String>? = null,
        @RequestParam(required = false) language: List<String>? = null,
        @RequestParam(required = false) year: String? = null
    ): ResponseEntity<*> {
        return when (val result = searchService.search(query, page, size, university, type, author, subject, language, year)) {
            is Success -> ResponseEntity.ok(result.value)
            is Failure -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An error occurred while processing the search")
        }
    }

    @PostMapping("/sync")
    fun syncPostgresToElasticsearch(): ResponseEntity<*> {
        return try {
            indexElasticService.syncAllThesesFromPostgres()
            ResponseEntity.ok(mapOf("message" to "Sync completed successfully"))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to (e.message ?: "Failed to sync data")))
        }
    }
}
