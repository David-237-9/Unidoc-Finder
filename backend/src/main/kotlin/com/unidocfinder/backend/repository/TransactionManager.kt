package com.unidocfinder.backend.repository

interface TransactionManager {
    fun <R> run(block: Transaction.() -> R): R
}