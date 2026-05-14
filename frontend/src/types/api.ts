export interface UniversityApiDto {
    id: string;
    name: string;
    repoUrl: string;
}

export interface ThesisApiDto {
    id: string;
    title: string;
    abstract: string;
    year: number;
    url: string;
    university: UniversityApiDto;
}
