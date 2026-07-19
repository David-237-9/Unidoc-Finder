package com.unidocfinder.backend.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebMvcConfig(
    private val accessTokenInterceptor: AccessTokenInterceptor
) : WebMvcConfigurer {

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(accessTokenInterceptor)
            .addPathPatterns(
                "/api/**"
            )
    }
}
