package com.unidocfinder.backend.repository

interface Transaction {
    val searchRepository: SearchRepository
    val universityRepository: UniversityRepository

    fun rollback()
}