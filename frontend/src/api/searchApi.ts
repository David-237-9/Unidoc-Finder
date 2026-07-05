import {apiRequest} from './httpClient';
import type {ThesisApiDto} from '../types/api';

export interface SearchThesisParams {
    query: string;
    page: number;
    size: number;
    // optional filters
    university?: string | null;
    type?: string | null;
    author?: string | null;
    subject?: string | null;
    language?: string | null;
    year?: string | null;
}

/**
 * Makes the http request to the api
 */
export function searchThesis(paramsObj: SearchThesisParams, signal?: AbortSignal): Promise<ThesisApiDto[]> {
    const {query, page, size, university, type, author, subject, language, year} = paramsObj;

    const params = new URLSearchParams({
        query,
        page: String(page),
        size: String(size)
    });

    if (university) params.append('university', university);
    if (type) params.append('type', type);
    if (author) params.append('author', author);
    if (subject) params.append('subject', subject);
    if (language) params.append('language', language);
    if (year) params.append('year', year);

    return apiRequest<ThesisApiDto[]>(`/search?${params.toString()}`, {signal});
}
