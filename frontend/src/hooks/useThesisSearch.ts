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
            return;
        }

        setIsLoading(true);
        setError(null);

        searchThesis({query, page, size})
            .then((theses) => {
                setDocuments(theses.map(mapThesisToDocument));
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : 'Failed to fetch results');
                setDocuments([]);
                setIsLoading(false);
            });

        return () => {};
    }, [query, page, size]);

    return {documents, isLoading, error};
}
