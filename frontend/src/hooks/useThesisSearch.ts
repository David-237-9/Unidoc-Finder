import {useEffect, useState} from 'react';
import {searchThesis} from '../api/searchApi';
import {mapThesisToDocument} from '../mappers/thesisMapper';
import type {DocumentRecord} from '../types/document';

export function useThesisSearch({query, page, size}: {query: string; page: number; size: number}) {
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

        searchThesis({query, page, size}, controller.signal)
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
    }, [query, page, size]);

    return {documents, isLoading, error};
}
