export interface UniversityApiDto {
    id?: string;
    name: string;
    repoUrl?: string;
}

export interface ThesisApiDto {
    id: string;
    title?: string | null;
    abstract?: string | null;
    year?: number | string | null;
    url?: string | null;
    authors?: string[] | null;
    subjects?: string[] | null;
    type?: string | null;
    language?: string | null;
    fileUrl?: string | null;
    university?: UniversityApiDto | string | null;
}
