import {DocumentCard} from '../DocumentCard/DocumentCard';
import type {DocumentRecord} from '../../types/document';
import styles from './ResultsList.module.css';

interface ResultsListProps {
    documents: DocumentRecord[];
    isLoading: boolean;
    error: string | null;
    hasSubmittedQuery: boolean;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    onPreviousPage: () => void;
    onNextPage: () => void;
}

export function ResultsList({
                                documents,
                                isLoading,
                                error,
                                hasSubmittedQuery,
                                page,
                                pageSize,
                                hasNextPage,
                                onPreviousPage,
                                onNextPage
                            }: ResultsListProps) {
    if (isLoading) {
        return <p className={styles.stateMessage}>A carregar resultados...</p>;
    }

    if (error) {
        return <p className={styles.errorState}>{error}</p>;
    }

    if (documents.length === 0) {
        return (
            <p className={styles.stateMessage}>
                {hasSubmittedQuery
                    ? 'Não foram encontrados documentos com os filtros atuais.'
                    : 'Introduza um termo de pesquisa para encontrar documentos.'}
            </p>
        );
    }

    return (
        <section className={styles.resultsShell} aria-label="Resultados de pesquisa">
            <div className={styles.results}>
                {documents.map((document) => (
                    <DocumentCard key={document.id} document={document}/>
                ))}
            </div>

            <nav className={styles.pagination} aria-label="Paginação de resultados">
                <button type="button" onClick={onPreviousPage} disabled={page === 1}>
                    Anterior
                </button>
                <span>
          Página {page} · {documents.length} de {pageSize}
        </span>
                <button type="button" onClick={onNextPage} disabled={!hasNextPage}>
                    Seguinte
                </button>
            </nav>
        </section>
    );
}
