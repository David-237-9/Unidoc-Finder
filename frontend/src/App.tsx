import {useMemo, useState} from 'react';
import {Header} from './components/Header/Header';
import {SearchBar} from './components/SearchBar/SearchBar';
import {FilterSidebar} from './components/FilterSidebar/FilterSidebar';
import {ResultsList} from './components/ResultsList/ResultsList';
import {useThesisSearch} from './hooks/useThesisSearch';
import type {DocumentRecord, DocumentType, SearchFilters} from './types/document';
import './styles.css';

const PAGE_SIZE = 10;

const initialFilters: SearchFilters = {
    university: '',
    category: [],
    subjects: [],
    author: '',
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

    const filteredDocuments = useMemo(() => {
        return documents.filter((document) => matchesSearch(document, selectedType, filters));
    }, [selectedType, documents, filters]);

    const handleSearchSubmit = () => {
        setSubmittedQuery(queryInput);
        setPage(1);
    };

    return (
        <main className="page-shell">
            <Header/>

            <div className="search-row">
                <SearchBar
                    selectedType={selectedType}
                    query={queryInput}
                    onTypeChange={setSelectedType}
                    onQueryChange={setQueryInput}
                    onSubmit={handleSearchSubmit}
                />
            </div>

            <div className="content-grid">
                <FilterSidebar filters={filters} onFiltersChange={setFilters}/>
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
    const matchesType = selectedType === 'All' || document.type === selectedType;

    const matchesUniversity =
        !filters.university || document.universityName.toLowerCase().includes(filters.university.toLowerCase());

    const matchesCategory = filters.category.length === 0 || filters.category.includes(document.category);

    const matchesSubjects =
        filters.subjects.length === 0 ||
        filters.subjects.every((subject) =>
            [document.title, document.abstract].join(' ').toLowerCase().includes(subject.toLowerCase())
        );

    const matchesPublicationRange =
        !filters.publicationRange ||
        (document.year >= filters.publicationRange[0] && document.year <= filters.publicationRange[1]);

    return matchesType && matchesUniversity && matchesCategory && matchesSubjects && matchesPublicationRange;
}

