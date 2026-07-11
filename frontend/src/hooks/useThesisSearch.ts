import {useEffect, useState} from 'react';
import {searchThesis} from '../api/searchApi';
import {mapThesisToDocument} from '../mappers/thesisMapper';
import type {DocumentRecord} from '../types/document';

export function useThesisSearch({query, page, size, filters}: {query: string; page: number; size: number; filters?: import('../types/document').SearchFilters}) {
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        const controller = new AbortController();

        setIsLoading(true);
        setError(null);

        // Map frontend filters to API params. Send all selected values for array filters.
        const apiParams: import('../api/searchApi').SearchThesisParams = {
            query,
            page,
            size,
            university: filters?.university || null,
            type: (filters?.category && filters.category.length > 0) ? filters.category : null,
            author: filters?.author || null,
            subjects: filters?.subjects || null,
            language: filters?.language || null,
            year: filters?.year || null
        };

        searchThesis(apiParams, controller.signal)
            .then((theses) => {
                setDocuments(theses.map(mapThesisToDocument));
            })
            .catch((err) => {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }

                setError(err instanceof Error ? err.message : 'Failed to fetch results');
                setDocuments([]);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => controller.abort();
    }, [query, page, size, filters]);

    return {documents, isLoading, error};
}
