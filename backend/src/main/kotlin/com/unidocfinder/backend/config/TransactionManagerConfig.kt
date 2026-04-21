package com.unidocfinder.backend.config

import com.unidocfinder.backend.jdbi.TransactionManagerJdbi
import com.unidocfinder.backend.jdbi.configureWithAppRequirements
import org.jdbi.v3.core.Jdbi
import org.postgresql.ds.PGSimpleDataSource
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class TransactionManagerConfiguration {
    private val jdbi = Jdbi.create(
        PGSimpleDataSource().apply {
            setURL("jdbc:postgresql:/localhost:5432/daw2?user=postgres&password=postgres")
        },
    ).configureWithAppRequirements()

    @Bean
    fun transactionManager(): TransactionManagerJdbi = TransactionManagerJdbi(jdbi)
}
