package com.unidocfinder.backend.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path

@Component
class AccessTokenProvider(
//    @Value("\${uf.secret.path:/run/secrets/uf_access_token}")
//    secretPath: String
) {
    val token: String = "TEST_TOKEN" // Files.readString(Path.of(secretPath)).trim()
}
