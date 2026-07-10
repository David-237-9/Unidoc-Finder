package com.unidocfinder.backend.benchmark

import com.unidocfinder.backend.domain.Thesis
import com.unidocfinder.backend.domain.ThesisDocument
import com.unidocfinder.backend.domain.University
import com.unidocfinder.backend.repository.ThesisElasticRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.SpringApplication
import org.springframework.context.ConfigurableApplicationContext
import org.springframework.context.annotation.Profile
import org.springframework.data.elasticsearch.core.ElasticsearchOperations
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.util.UUID
import kotlin.math.roundToLong
import kotlin.system.measureNanoTime

@Component
@Profile("benchmark")
class SearchBenchmarkRunner(
    private val thesisElasticRepository: ThesisElasticRepository,
    private val elasticsearchOperations: ElasticsearchOperations,
    private val applicationContext: ConfigurableApplicationContext,
    @Value("\${benchmark.query:sustainable development}") private val query: String,
    @Value("\${benchmark.rows:5000}") private val rows: Int,
    @Value("\${benchmark.page:1}") private val page: Int,
    @Value("\${benchmark.size:10}") private val size: Int,
    @Value("\${benchmark.warmup:10}") private val warmup: Int,
    @Value("\${benchmark.iterations:100}") private val iterations: Int,
    @Value("\${benchmark.index:true}") private val index: Boolean,
    @Value("\${benchmark.cleanup:true}") private val cleanup: Boolean,
) : CommandLineRunner {
    private val logger = LoggerFactory.getLogger(SearchBenchmarkRunner::class.java)

    /**
     * Runs the benchmark.
     */
    override fun run(vararg args: String) {
        val benchmarkUniversity = getBenchmarkUniversity()
        val benchmarkTheses = if (rows > 0) buildBenchmarkDataset(benchmarkUniversity, rows) else emptyList()

        try {
            require(rows > 0) { "benchmark.rows must be greater than 0" }
            require(page > 0) { "benchmark.page must be greater than 0" }
            require(size > 0) { "benchmark.size must be greater than 0" }
            require(warmup >= 0) { "benchmark.warmup cannot be negative" }
            require(iterations > 0) { "benchmark.iterations must be greater than 0" }

            if (cleanup) deleteBenchmarkData(benchmarkTheses)

            if (index) indexElasticsearch(benchmarkTheses)
            else logger.info("Skipping Elasticsearch indexing because benchmark.index=false")

            val elasticResultCount = elasticSearch().size

            repeat(warmup) {
                elasticSearch()
            }

            val elasticTimes = runBenchmark(iterations) { elasticSearch() }

            printReport(elasticResultCount = elasticResultCount, elasticStats = elasticTimes.toStats(),)
        } finally {
            if (cleanup) deleteBenchmarkData(benchmarkTheses)
            else logger.info("Skipping benchmark cleanup because benchmark.cleanup=false")
            SpringApplication.exit(applicationContext)
        }
    }

    /**
     * Deletes the benchmark data.
     * @param theses The list of benchmark theses to delete.
     */
    private fun deleteBenchmarkData(theses: List<Thesis>) {
        deleteBenchmarkThesesFromElasticsearch(theses)
    }

    /**
     * Deletes the benchmark theses from Elasticsearch.
     * @param theses The list of benchmark theses to delete.
     */
    private fun deleteBenchmarkThesesFromElasticsearch(theses: List<Thesis>) {
        if (theses.isEmpty()) return

        runCatching {
            logger.info("Deleting {} benchmark theses from Elasticsearch", theses.size)
            theses.forEach { thesis ->
                elasticsearchOperations.delete(thesis.id.toString(), ThesisDocument::class.java)
            }
            elasticsearchOperations.indexOps(ThesisDocument::class.java).refresh()
        }.onFailure { exception ->
            logger.warn("Could not delete benchmark theses from Elasticsearch: {}", exception.message)
        }
    }

    /**
     * Indexes the benchmark theses into Elasticsearch.
     * @param theses The list of benchmark theses to index.
     */
    private fun indexElasticsearch(theses: List<Thesis>) {
        logger.info("Indexing {} benchmark theses in Elasticsearch", theses.size)
        val documents = theses.map { it.toDocument() }
        thesisElasticRepository.saveAll(documents)
        elasticsearchOperations.indexOps(ThesisDocument::class.java).refresh()
    }

    /**
     * Performs a search query in Elasticsearch and returns the list of matching thesis documents.
     * @return A list of matching thesis documents from Elasticsearch.
     */
    private fun elasticSearch(): List<ThesisDocument> = thesisElasticRepository.searchThesis(
        query = query,
        page = page,
        size = size,
        university = null,
        type = null,
        author = null,
        subject = null,
        language = null,
        year = null,
    )

    /**
     * Runs a benchmark by executing the provided block of code a specified number of times and measuring the execution time in milliseconds.
     * @param times The number of times to execute the block of code.
     * @param block The block of code to execute and measure.
     * @return A list of execution times in milliseconds for each iteration.
     */
    private fun runBenchmark(times: Int, block: () -> Any): List<Double> {
        return List(times) {
            val elapsedNanos = measureNanoTime { block() }
            elapsedNanos / 1_000_000.0
        }
    }

    /**
     * Prints a report for Elasticsearch, including average latency and percentiles.
     * @param elasticResultCount The number of results returned by Elasticsearch.
     * @param elasticStats The statistics for Elasticsearch search performance.
     */
    private fun printReport(elasticResultCount: Int, elasticStats: Stats) {
        println()
        println("================ Search benchmark ================")
        println("Query: '$query'")
        println("Rows seeded/indexed: $rows")
        println("Page/size: $page/$size")
        println("Warmup iterations: $warmup")
        println("Measured iterations: $iterations")
        println("Elasticsearch results returned: $elasticResultCount")
        println()
        println("  avg ms    p50 ms    p95 ms    min ms    max ms")
        println(elasticStats.format())
        println("==================================================")
        println()
    }

    /**
     * Builds a benchmark dataset of theses for the specified university.
     * @param university The university for which to create the benchmark theses.
     * @param count The number of benchmark theses to create.
     * @return A list of benchmark theses.
     */
    private fun buildBenchmarkDataset(university: University, count: Int): List<Thesis> {
        return (1..count).map { number ->
            val containsQuery = number % 3 == 0
            val title = if (containsQuery) "Sustainable Development Goals Identification in Academic Documents Search #$number"
            else "Distributed systems and university repositories #$number"

            val abstract = if (containsQuery) "This thesis discusser sustainable development goals, and information retrieval. Sample $number."
            else "This thesis discusses databases, HTTP APIs, metadata harvesting, repository interoperability and backend architecture. Sample $number."

            Thesis(
                id = deterministicUuid("benchmark-thesis-$number"),
                title = title,
                abstract = abstract,
                year = 2015 + (number % 10),
                url = "https://benchmark.local/thesis/$number",
                authors = listOf("Benchmark Author ${number % 100}", "Researcher ${number % 25}"),
                subjects = if (containsQuery) listOf("Sustainable Development", "Search") else listOf("Databases", "Repositories"),
                type = if (number % 2 == 0) "master" else "phd",
                language = if (number % 5 == 0) "pt" else "en",
                fileUrl = "https://benchmark.local/thesis/$number.pdf",
                university = university,
                hash = "benchmark-thesis-$number",
            )
        }
    }

    /**
     * Returns a benchmark university object with a deterministic UUID and predefined name and repository URL.
     * @return A benchmark university object.
     */
    private fun getBenchmarkUniversity(): University = University(
        id = deterministicUuid("benchmark-university"),
        name = "Benchmark University",
        repoUrl = "https://benchmark.local/oai/request",
    )

    /**
     * Converts a thesis to a document for indexing.
     * @return A thesis document.
     */
    private fun Thesis.toDocument(): ThesisDocument = ThesisDocument(
        id = id.toString(),
        title = title,
        abstract = abstract,
        year = year.toString(),
        url = url,
        authors = authors,
        subjects = subjects,
        type = type,
        language = language,
        fileUrl = fileUrl,
        university = university.name,
        hash = hash,
    )

    /**
     * Generates a deterministic UUID based on the provided string value using UTF-8 encoding.
     * @param value The string value to generate the UUID from.
     * @return A deterministic UUID based on the input string.
     */
    private fun deterministicUuid(value: String): UUID = UUID.nameUUIDFromBytes(value.toByteArray(StandardCharsets.UTF_8))

    /**
     * Data class representing statistics for search performance, including average latency, percentiles, minimum and maximum latency.
     * @property averageMs The average latency in milliseconds.
     * @property p50Ms The 50th percentile latency in milliseconds.
     * @property p95Ms The 95th percentile latency in milliseconds.
     * @property minMs The minimum latency in milliseconds.
     * @property maxMs The maximum latency in milliseconds.
     */
    private data class Stats(
        val averageMs: Double,
        val p50Ms: Double,
        val p95Ms: Double,
        val minMs: Double,
        val maxMs: Double,
    ) {
        /**
         * Formats the statistics into a string representation with fixed-width columns for average, percentiles, minimum, and maximum latency.
         * @return A formatted string representation of the statistics.
         */
        fun format(): String = "%8.2f  %8.2f  %8.2f  %8.2f  %8.2f"
            .format(averageMs, p50Ms, p95Ms, minMs, maxMs)
    }

    /**
     * Converts a list of doubles representing execution times into a Stats object containing average, percentiles, minimum, and maximum latency.
     * @return A Stats object containing the calculated statistics.
     */
    private fun List<Double>.toStats(): Stats {
        val sorted = sorted()
        return Stats(
            averageMs = average(),
            p50Ms = sorted.percentile(0.50),
            p95Ms = sorted.percentile(0.95),
            minMs = sorted.first(),
            maxMs = sorted.last(),
        )
    }

    /**
     * Calculates the specified percentile of a sorted list of doubles.
     * @param percentile The desired percentile (between 0.0 and 1.0).
     * @return The value at the specified percentile in the list.
     */
    private fun List<Double>.percentile(percentile: Double): Double {
        val index = ((size - 1) * percentile).roundToLong().toInt().coerceIn(indices)
        return this[index]
    }

    /**
     * Formats a double value as a string with a specified number of decimal places.
     * @param decimals The number of decimal places to include.
     * @return The formatted string representation of the double value.
     */
    private fun Double.format(decimals: Int): String = "%.${decimals}f".format(this)
}
