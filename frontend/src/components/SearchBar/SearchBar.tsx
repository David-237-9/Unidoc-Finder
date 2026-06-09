import {Search, Globe2} from 'lucide-react';
import type {DocumentType} from '../../types/document';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    selectedType: DocumentType | 'All';
    documentTypes: DocumentType[];
    query: string;
    onTypeChange: (type: DocumentType | 'All') => void;
    onQueryChange: (query: string) => void;
    onSubmit: () => void;
}

export function SearchBar({
                              selectedType,
                              documentTypes,
                              query,
                              onTypeChange,
                              onQueryChange,
                              onSubmit
                          }: SearchBarProps) {
    const options = buildTypeOptions(documentTypes, selectedType);

    return (
        <form
            className={styles.searchBar}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <label className={styles.selectLabel} htmlFor="doc-type">
                <span>{formatTypeLabel(selectedType)}</span>
                <select
                    id="doc-type"
                    value={selectedType}
                    onChange={(event) => onTypeChange(event.target.value as DocumentType | 'All')}
                >
                    {options.map((type) => (
                        <option key={type} value={type}>
                            {formatTypeLabel(type)}
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

function buildTypeOptions(documentTypes: DocumentType[], selectedType: DocumentType | 'All'): Array<DocumentType | 'All'> {
    const uniqueTypes = Array.from(new Set(documentTypes.filter(Boolean)));

    if (selectedType !== 'All' && !uniqueTypes.includes(selectedType)) {
        uniqueTypes.unshift(selectedType);
    }

    return ['All', ...uniqueTypes];
}

function formatTypeLabel(type: DocumentType | 'All'): string {
    return type === 'All' ? 'Todos' : type;
}
