import {Search, Globe2} from 'lucide-react';
import type {DocumentType} from '../../types/document';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    selectedType: DocumentType | 'All';
    query: string;
    onTypeChange: (type: DocumentType | 'All') => void;
    onQueryChange: (query: string) => void;
    onSubmit: () => void;
}

const documentTypes: Array<DocumentType | 'All'> = ['All', 'Thesis'];

export function SearchBar({selectedType, query, onTypeChange, onQueryChange, onSubmit}: SearchBarProps) {
    return (
        <form
            className={styles.searchBar}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <label className={styles.selectLabel} htmlFor="doc-type">
                <span>Documentos</span>
                <select
                    id="doc-type"
                    value={selectedType}
                    onChange={(event) => onTypeChange(event.target.value as DocumentType | 'All')}
                >
                    {documentTypes.map((type) => (
                        <option key={type} value={type}>
                            {type === 'All' ? 'Todos' : 'Tese'}
                        </option>
                    ))}
                </select>
            </label>

            <label className={styles.inputWrapper} htmlFor="search-term">
                <Search size={18} aria-hidden="true"/>
                <input
                    id="search-term"
                    type="search"
                    placeholder="Search terms here"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                />
            </label>

            <button className={styles.submitButton} type="submit" aria-label="Pesquisar">
                <Globe2 size={34} strokeWidth={1.6}/>
            </button>
        </form>
    );
}
