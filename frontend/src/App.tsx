import {useMemo, useState, useEffect} from 'react';
import {Header} from './components/Header/Header';
import {SearchBar} from './components/SearchBar/SearchBar';
import {FilterSidebar} from './components/FilterSidebar/FilterSidebar';
import {ResultsList} from './components/ResultsList/ResultsList';
import {useThesisSearch} from './hooks/useThesisSearch';
import type {DocumentRecord, DocumentType, FilterOptions, SearchFilters} from './types/document';
import './styles.css';

const SUBJECTS_PT = [
    { label: "Ciência da Computação", value: "computer_science" },
    { label: "Engenharia Informática", value: "computer_engineering" },
    { label: "Matemática", value: "mathematics" },
    { label: "Física", value: "physics" },
    { label: "Química", value: "chemistry" },
    { label: "Biologia", value: "biology" },
    { label: "Engenharia Civil", value: "civil_engineering" },
    { label: "Engenharia Eletrotécnica", value: "electrical_engineering" },
    { label: "Economia", value: "economics" },
    { label: "Gestão", value: "management" },
    { label: "Psicologia", value: "psychology" },
    { label: "Sociologia", value: "sociology" },
    { label: "Direito", value: "law" },
    { label: "Medicina", value: "medicine" },
    { label: "Arquitectura", value: "architecture" },
    { label: "Engenharia Mecânica", value: "mechanical_engineering" },
    { label: "Ciências da Educação", value: "education_sciences" },
    { label: "Bioquímica", value: "biochemistry" },
    { label: "Engenharia Química", value: "chemical_engineering" },
    { label: "Geografia", value: "geography" }
];

const TYPES_PT = [
    { label: "Mestrado", value: "master thesis" },
    { label: "Doutoramento", value: "doctoral thesis" }
];

const PAGE_SIZE = 10;

const initialFilters: SearchFilters = {
    university: '',
    category: [],
    subjects: [],
    author: '',
    language: [],
    publicationRange: null
};

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default function App() {
    const [selectedType, setSelectedType] = useState<DocumentType | 'All'>('All');
    const [queryInput, setQueryInput] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [filters, setFilters] = useState<SearchFilters>(initialFilters);
    const [page, setPage] = useState(1);
    const [universitiesList, setUniversitiesList] = useState<string[]>([]);

    const {documents, isLoading, error} = useThesisSearch({
        query: submittedQuery,
        page,
        size: PAGE_SIZE,
        filters
    });

    // Fetch universities from backend
    useEffect(() => {
        let mounted = true;
        fetch(`/api/universities?page=1&size=200`)
            .then((res) => res.ok ? res.json() : Promise.reject(new Error('Failed to load'))) 
            .then((data: any[]) => {
                if (!mounted) return;
                const names = data.map((u) => u.name).filter(Boolean);
                setUniversitiesList(Array.from(new Set(names)).sort((a,b) => a.localeCompare(b)));
            })
            .catch(() => {
                // ignore, keep empty list
            });
        return () => { mounted = false; };
    }, []);

    const filterOptions = useMemo(() => ({
        categories: TYPES_PT,
        subjects: SUBJECTS_PT,
        languages: uniqueSorted(documents.map((document) => document.language).filter(isMeaningfulValue)),
        yearRanges: buildYearRanges(documents),
        universities: universitiesList
    }), [documents, universitiesList]);

    const filteredDocuments = useMemo(() => {
        return documents.filter((document) => matchesSearch(document, selectedType, filters));
    }, [selectedType, documents, filters]);

    const scrollToTop = () => {
        window.scrollTo({top: 0, left: 0, behavior: 'smooth'});
    };

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

    const handlePreviousPage = () => {
        setPage((currentPage) => Math.max(1, currentPage - 1));
        delay(10).then(_ => scrollToTop()); // Delay scrol to avoid bugs
    };

    const handleNextPage = () => {
        setPage((currentPage) => currentPage + 1);
        delay(10).then(_ => scrollToTop()); // Delay scrol to avoid bugs
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
                    hasSubmittedQuery={submittedQuery.trim().length > 0}
                    page={page}
                    pageSize={PAGE_SIZE}
                    hasNextPage={documents.length === PAGE_SIZE}
                    onPreviousPage={handlePreviousPage}
                    onNextPage={handleNextPage}
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
    const categories = uniqueSorted(documents.map((document) => document.type).filter(isMeaningfulValue));
    const subjects = uniqueSorted(documents.flatMap((document) => document.subjects).filter(isMeaningfulValue));
    return {
        categories: categories.map(c => ({label: c, value: c})),
        subjects: subjects.map(s => ({label: s, value: s})),
        languages: uniqueSorted(documents.map((document) => document.language).filter(isMeaningfulValue)),
        yearRanges: buildYearRanges(documents),
        universities: []
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
