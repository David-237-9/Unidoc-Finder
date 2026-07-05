import {useEffect, useState} from 'react';
import {searchThesis} from '../api/searchApi';
import {mapThesisToDocument} from '../mappers/thesisMapper';
import type {DocumentRecord} from '../types/document';

export function useThesisSearch({query, page, size, filters}: {query: string; page: number; size: number; filters?: import('../types/document').SearchFilters}) {
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query.trim()) {
            setDocuments([]);
            setError(null);
            return;
        }

        const controller = new AbortController();

        setIsLoading(true);
        setError(null);

        // Map frontend filters to API params. For array filters we send the first selected value.
        const apiParams: import('../api/searchApi').SearchThesisParams = {
            query,
            page,
            size,
            university: filters?.university || null,
            type: (filters?.category && filters.category.length > 0) ? filters.category[0] : null,
            author: filters?.author || null,
            subject: (filters?.subjects && filters.subjects.length > 0) ? filters.subjects[0] : null,
            language: (filters?.language && filters.language.length > 0) ? filters.language[0] : null,
            year: filters?.publicationRange ? String(filters.publicationRange[0]) : null
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
