package com.unidocfinder.backend.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path

@Component
class AccessTokenProvider(
    @Value("\${uf.secret.path:/run/secrets/UF_ACCESS_TOKEN}")
    secretPath: String
) {
    val token: String = Files.readString(Path.of(secretPath))
        .trim()
        .also { require(it.isNotEmpty()) { "UF_ACCESS_TOKEN Docker secret is empty" } }
}
