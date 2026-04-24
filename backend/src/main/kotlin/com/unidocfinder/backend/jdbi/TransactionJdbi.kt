package com.unidocfinder.backend.jdbi

import com.unidocfinder.backend.repository.Transaction
import com.unidocfinder.backend.repository.SearchRepository
import com.unidocfinder.backend.repository.UniversityRepository
import org.jdbi.v3.core.Handle


class TransactionJdbi(private val handle: Handle): Transaction {
    override val searchRepository: SearchRepository = SearchRepositoryJdbi(handle)
    override val universityRepository: UniversityRepository = UniversityRepositoryJdbi(handle)

    override fun rollback() {
        handle.rollback()
    }
}
