import {apiRequest} from './httpClient';
import type {ThesisApiDto} from '../types/api';

export interface SearchThesisParams {
    query: string;
    page: number;
    size: number;
}

/**
 * Makes the http request to the api
 */
export function searchThesis({query, page, size}: SearchThesisParams, signal?: AbortSignal): Promise<ThesisApiDto[]> {
    const params = new URLSearchParams({
        query,
        page: String(page),
        size: String(size)
    });

    return apiRequest<ThesisApiDto[]>(`/search?${params.toString()}`, {signal});
}
