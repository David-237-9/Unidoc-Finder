package com.unidocfinder.backend.config

import com.unidocfinder.backend.jdbi.TransactionManagerJdbi
import com.unidocfinder.backend.jdbi.configureWithAppRequirements
import org.jdbi.v3.core.Jdbi
import org.postgresql.ds.PGSimpleDataSource
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class TransactionManagerConfiguration {

    @Value("\${db.url}")
    private lateinit var dbUrl: String

    @Value("\${db.user}")
    private lateinit var dbUser: String

    @Value("\${db.password}")
    private lateinit var dbPassword: String

    @Bean
    fun transactionManager(): TransactionManagerJdbi {
        val jdbi = Jdbi.create(
            PGSimpleDataSource().apply {
                setURL(dbUrl)
                user = dbUser
                password = dbPassword
            },
        ).configureWithAppRequirements()
        return TransactionManagerJdbi(jdbi)
    }
}
