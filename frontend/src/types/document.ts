export type DocumentType = string;

export interface DocumentRecord {
    id: string;
    title: string;
    abstract: string;
    year: number | null;
    url: string;
    type: DocumentType;
    category: string;
    universityName: string;
    universityRepoUrl?: string;
    authors: string[];
    subjects: string[];
    language: string;
    fileUrl?: string | null;
}

export interface SearchFilters {
    university: string;
    category: string[];
    subjects: string;
    author: string;
    language: string;
    year: string;
}

export interface OptionItem {
    label: string;
    value: string;
}

export interface FilterOptions {
    categories: OptionItem[];
    subjects: OptionItem[];
    languages: string[];
    universities: string[];
}
