package com.unidocfinder.backend.controller

import com.unidocfinder.backend.service.Either
import com.unidocfinder.backend.service.Failure
import com.unidocfinder.backend.service.SearchService
import com.unidocfinder.backend.service.Success
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController


@RestController
@RequestMapping("/api/search")
class SearchController(private val searchService: SearchService) {

    @GetMapping
    fun search(
        @RequestParam(value = "query", required = true) query: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ) : ResponseEntity<*> {
        val result = searchService.search(query, page, size)

        return when (result) {
            is Success -> ResponseEntity.ok(result.value)
            is Failure -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred while processing the search")
        }
    }

}