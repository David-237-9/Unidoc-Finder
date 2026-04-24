package com.unidocfinder.backend.repository

import com.unidocfinder.backend.domain.University
import jakarta.inject.Named

@Named
interface UniversityRepository : Repository<University>