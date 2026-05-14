import type {ThesisApiDto} from '../types/api';
import type {DocumentRecord} from '../types/document';

export function mapThesisToDocument(thesis: ThesisApiDto): DocumentRecord {
    return {
        id: thesis.id,
        title: thesis.title,
        abstract: thesis.abstract,
        year: thesis.year,
        url: thesis.url,
        type: 'Thesis',
        category: 'Dissertation',
        universityName: thesis.university.name,
        universityRepoUrl: thesis.university.repoUrl
    };
}
