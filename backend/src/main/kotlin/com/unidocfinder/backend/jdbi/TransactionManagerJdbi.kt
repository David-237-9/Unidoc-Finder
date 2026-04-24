package com.unidocfinder.backend.jdbi

import com.unidocfinder.backend.repository.Transaction
import com.unidocfinder.backend.repository.TransactionManager
import org.jdbi.v3.core.Jdbi

class TransactionManagerJdbi(
    private val jdbi: Jdbi
): TransactionManager {
    override fun <R> run(
        block: Transaction.() -> R
    ): R {
        return jdbi.inTransaction<R, Exception> { handle ->
            val transaction = TransactionJdbi(handle)
            block(transaction)
        }
    }
}