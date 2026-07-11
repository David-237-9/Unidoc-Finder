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
    subjects: '',
    author: '',
    language: '',
    year: ''
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
        universities: universitiesList,
    }), [documents, universitiesList]);

    // Use server-side filtered documents directly so pagination remains consistent
    // (the server applies the filters passed via the search API)
    const filteredDocuments = documents;

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

function uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function isMeaningfulValue(value: string): boolean {
    return Boolean(value && value.trim().toLowerCase() !== 'unknown');
}
