import {apiRequest} from './httpClient';
import type {ThesisApiDto} from '../types/api';

export interface SearchThesisParams {
    query: string;
    page: number;
    size: number;
    // optional filters
    university?: string | null;
    type?: string[] | null;  // array to support multiple values
    author?: string | null;
    subjects?: string | null;  // array to support multiple values
    language?: string | null;  // array to support multiple values
    year?: string | null;
}

/**
 * Makes the http request to the api
 */
export function searchThesis(paramsObj: SearchThesisParams, signal?: AbortSignal): Promise<ThesisApiDto[]> {
    const {query, page, size, university, type, author, subjects, language, year} = paramsObj;

    const params = new URLSearchParams({
        query,
        page: String(page),
        size: String(size)
    });

    if (university) params.append('university', university);
    
    // Support multiple types
    if (type && Array.isArray(type)) {
        type.forEach(t => params.append('type', t));
    }
    
    if (author) params.append('author', author);

    if (subjects) params.append('subject', subjects);
    
    // Support multiple languages
    if (language) params.append('language', language);

    if (year) params.append('year', year);

    return apiRequest<ThesisApiDto[]>(`/search?${params.toString()}`, {signal});
}
