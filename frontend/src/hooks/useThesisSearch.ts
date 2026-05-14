import {useEffect, useMemo, useState} from 'react';
import {searchThesis} from '../api/searchApi';
import {mapThesisToDocument} from '../mappers/thesisMapper';
import type {DocumentRecord} from '../types/document';

interface ThesisSearchState {
    documents: DocumentRecord[];
    isLoading: boolean;
    error: string | null;
}

interface UseThesisSearchParams {
    query: string;
    page: number;
    size: number;
}

interface ThesisSearchResult {
    requestKey: string;
    documents: DocumentRecord[];
    error: string | null;
}

export function useThesisSearch({query, page, size}: UseThesisSearchParams): ThesisSearchState {
    const normalizedQuery = useMemo(() => query.trim(), [query]);

    const requestKey = useMemo(
        () => `${normalizedQuery}:${page}:${size}`,
        [normalizedQuery, page, size]
    );

    const [result, setResult] = useState<ThesisSearchResult | null>(null);

    useEffect(() => {
        if (!normalizedQuery) {
            return;
        }

        const controller = new AbortController();

        searchThesis(
            {
                query: normalizedQuery,
                page,
                size
            },
            controller.signal
        )
            .then((theses) => {
                if (controller.signal.aborted) {
                    return;
                }

                setResult({
                    requestKey,
                    documents: theses.map(mapThesisToDocument),
                    error: null
                });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setResult({
                    requestKey,
                    documents: [],
                    error: error instanceof Error ? error.message : 'Não foi possível obter resultados da API.'
                });
            });

        return () => controller.abort();
    }, [normalizedQuery, page, size, requestKey]);

    if (!normalizedQuery) {
        return {
            documents: [],
            isLoading: false,
            error: null
        };
    }

    const hasCurrentResult = result?.requestKey === requestKey;

    return {
        documents: hasCurrentResult ? result.documents : [],
        isLoading: !hasCurrentResult,
        error: hasCurrentResult ? result.error : null
    };
}
