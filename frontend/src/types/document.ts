export type DocumentType = 'Thesis';

export interface DocumentRecord {
    id: string;
    title: string;
    abstract: string;
    year: number;
    url: string;
    type: DocumentType;
    category: string;
    universityName: string;
    universityRepoUrl: string;
}

export interface SearchFilters {
    university: string;
    category: string[];
    subjects: string[];
    author: string;
    publicationRange: [number, number] | null;
}
