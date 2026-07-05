import {Search, Globe2} from 'lucide-react';
import type {OptionItem} from '../../types/document';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    selectedType: string | 'All';
    documentTypes: OptionItem[];
    query: string;
    onTypeChange: (type: string | 'All') => void;
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
                <span>{formatTypeLabel(selectedType, documentTypes)}</span>
                <select
                    id="doc-type"
                    value={selectedType}
                    onChange={(event) => onTypeChange(event.target.value as string | 'All')}
                >
                    {options.map((opt) => (
                        opt === 'All' ? (
                            <option key="All" value="All">Todos</option>
                        ) : (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        )
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

function buildTypeOptions(documentTypes: OptionItem[], selectedType: string | 'All'): Array<OptionItem | 'All'> {
    const uniqueTypes = Array.from(new Map(documentTypes.map(d => [d.value, d])).values());

    if (selectedType !== 'All' && !uniqueTypes.some(t => t.value === selectedType)) {
        // if selectedType is not in list add a placeholder option
        uniqueTypes.unshift({label: selectedType, value: selectedType});
    }

    return ['All', ...uniqueTypes];
}

function formatTypeLabel(type: string | 'All', documentTypes: OptionItem[]): string {
    if (type === 'All') return 'Todos';
    const found = documentTypes.find(d => d.value === type);
    return found ? found.label : type;
}
