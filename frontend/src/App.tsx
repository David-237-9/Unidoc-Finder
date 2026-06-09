import {useMemo, useState} from 'react';
import {Header} from './components/Header/Header';
import {SearchBar} from './components/SearchBar/SearchBar';
import {FilterSidebar} from './components/FilterSidebar/FilterSidebar';
import {ResultsList} from './components/ResultsList/ResultsList';
import {useThesisSearch} from './hooks/useThesisSearch';
import type {DocumentRecord, DocumentType, FilterOptions, SearchFilters} from './types/document';
import './styles.css';

const PAGE_SIZE = 10;

const initialFilters: SearchFilters = {
    university: '',
    category: [],
    subjects: [],
    author: '',
    language: [],
    publicationRange: null
};

export default function App() {
    const [selectedType, setSelectedType] = useState<DocumentType | 'All'>('All');
    const [queryInput, setQueryInput] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [filters, setFilters] = useState<SearchFilters>(initialFilters);
    const [page, setPage] = useState(1);

    const {documents, isLoading, error} = useThesisSearch({
        query: submittedQuery,
        page,
        size: PAGE_SIZE
    });

    const filterOptions = useMemo(() => buildFilterOptions(documents), [documents]);

    const filteredDocuments = useMemo(() => {
        return documents.filter((document) => matchesSearch(document, selectedType, filters));
    }, [selectedType, documents, filters]);

    const handleSearchSubmit = () => {
        setSubmittedQuery(queryInput);
        setPage(1);
    };

    const handleTypeChange = (type: DocumentType | 'All') => {
        setSelectedType(type);
        setPage(1);
    };

    const handleFiltersChange = (nextFilters: SearchFilters) => {
        setFilters(nextFilters);
        setPage(1);
    };

    return (
        <main className="page-shell">
            <Header/>

            <div className="search-row">
                <SearchBar
                    selectedType={selectedType}
                    documentTypes={filterOptions.categories}
                    query={queryInput}
                    onTypeChange={handleTypeChange}
                    onQueryChange={setQueryInput}
                    onSubmit={handleSearchSubmit}
                />
            </div>

            <div className="content-grid">
                <FilterSidebar filters={filters} options={filterOptions} onFiltersChange={handleFiltersChange}/>
                <ResultsList
                    documents={filteredDocuments}
                    isLoading={isLoading}
                    error={error}
                    page={page}
                    pageSize={PAGE_SIZE}
                    hasNextPage={documents.length === PAGE_SIZE}
                    onPreviousPage={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    onNextPage={() => setPage((currentPage) => currentPage + 1)}
                />
            </div>
        </main>
    );
}

function matchesSearch(
    document: DocumentRecord,
    selectedType: DocumentType | 'All',
    filters: SearchFilters
): boolean {
    const documentType = normalizeForCompare(document.type);
    const matchesType = selectedType === 'All' || documentType === normalizeForCompare(selectedType);

    const matchesUniversity =
        !filters.university || normalizeForCompare(document.universityName).includes(normalizeForCompare(filters.university));

    const matchesCategory =
        filters.category.length === 0 || filters.category.some((category) => documentType === normalizeForCompare(category));

    const searchableSubjects = [document.title, document.abstract, ...document.subjects].join(' ');
    const matchesSubjects =
        filters.subjects.length === 0 ||
        filters.subjects.every((subject) => normalizeForCompare(searchableSubjects).includes(normalizeForCompare(subject)));

    const searchableAuthors = document.authors.join(' ');
    const matchesAuthor =
        !filters.author || normalizeForCompare(searchableAuthors).includes(normalizeForCompare(filters.author));

    const matchesLanguage =
        filters.language.length === 0 || filters.language.some((language) => normalizeForCompare(language) === normalizeForCompare(document.language));

    const matchesPublicationRange =
        !filters.publicationRange ||
        (document.year !== null && document.year >= filters.publicationRange[0] && document.year <= filters.publicationRange[1]);

    return (
        matchesType &&
        matchesUniversity &&
        matchesCategory &&
        matchesSubjects &&
        matchesAuthor &&
        matchesLanguage &&
        matchesPublicationRange
    );
}

function buildFilterOptions(documents: DocumentRecord[]): FilterOptions {
    return {
        categories: uniqueSorted(documents.map((document) => document.type).filter(isMeaningfulValue)),
        subjects: uniqueSorted(documents.flatMap((document) => document.subjects).filter(isMeaningfulValue)),
        languages: uniqueSorted(documents.map((document) => document.language).filter(isMeaningfulValue)),
        yearRanges: buildYearRanges(documents)
    };
}

function buildYearRanges(documents: DocumentRecord[]): Array<{ label: string; value: [number, number] }> {
    const decades = new Map<number, [number, number]>();

    documents.forEach((document) => {
        if (document.year === null) {
            return;
        }

        const start = Math.floor(document.year / 10) * 10;
        decades.set(start, [start, start + 9]);
    });

    return Array.from(decades.entries())
        .sort(([left], [right]) => right - left)
        .map(([start, value]) => ({label: `${start} - ${value[1]}`, value}));
}

function uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function isMeaningfulValue(value: string): boolean {
    return Boolean(value && value.trim().toLowerCase() !== 'unknown');
}

function normalizeForCompare(value: string): string {
    return value.trim().toLowerCase();
}
