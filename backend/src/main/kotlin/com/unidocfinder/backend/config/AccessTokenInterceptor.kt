package com.unidocfinder.backend.config

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class AccessTokenInterceptor(
    private val accessTokenProvider: AccessTokenProvider
) : HandlerInterceptor {

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        // Only protect POST requests
        if (request.method != "POST") return true

        val token = request.getHeader("Authorization")
            ?.removePrefix("Bearer ")
            ?.trim()

        if (token != accessTokenProvider.token) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Unauthorized")
            return false
        }

        return true
    }
}
