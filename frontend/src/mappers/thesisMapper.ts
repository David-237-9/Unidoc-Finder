import type {ThesisApiDto, UniversityApiDto} from '../types/api';
import type {DocumentRecord} from '../types/document';

export function mapThesisToDocument(thesis: ThesisApiDto): DocumentRecord {
    const university = normalizeUniversity(thesis.university);
    const type = normalizeString(thesis.type, 'Unknown');

    return {
        id: normalizeString(thesis.id, `${normalizeString(thesis.title, 'untitled')}-${normalizeString(thesis.url, 'no-url')}`),
        title: normalizeString(thesis.title, 'Untitled document'),
        abstract: normalizeString(thesis.abstract, 'No abstract available.'),
        year: normalizeYear(thesis.year),
        url: normalizeString(thesis.url, normalizeString(thesis.fileUrl, '#')),
        type,
        category: type,
        authors: normalizeStringList(thesis.authors),
        subjects: normalizeStringList(thesis.subjects),
        language: normalizeString(thesis.language, 'Unknown'),
        fileUrl: thesis.fileUrl ?? null,
        universityName: university.name,
        universityRepoUrl: university.repoUrl
    };
}

function normalizeUniversity(university: ThesisApiDto['university']): Required<Pick<UniversityApiDto, 'name'>> & Pick<UniversityApiDto, 'repoUrl'> {
    if (typeof university === 'string') {
        return {name: normalizeString(university, 'Unknown university')};
    }

    return {
        name: normalizeString(university?.name, 'Unknown university'),
        repoUrl: normalizeString(university?.repoUrl, '') || undefined
    };
}

function normalizeString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeStringList(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeYear(value: ThesisApiDto['year']): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}
