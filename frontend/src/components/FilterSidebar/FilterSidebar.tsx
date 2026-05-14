import {Globe2} from 'lucide-react';
import {FilterSection} from '../FilterSection/FilterSection';
import {TagPill} from '../TagPill/TagPill';
import type {SearchFilters} from '../../types/document';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
}

const categories = ['Dissertation'];
const yearRanges: Array<{ label: string; value: [number, number] }> = [
    {label: '2020 - 2026', value: [2020, 2026]},
    {label: '2010 - 2019', value: [2010, 2019]},
    {label: '2000 - 2009', value: [2000, 2009]},
];

export function FilterSidebar({filters, onFiltersChange}: FilterSidebarProps) {
    const toggleCategory = (category: string) => {
        const nextCategories = filters.category.includes(category)
            ? filters.category.filter((item) => item !== category)
            : [...filters.category, category];

        onFiltersChange({...filters, category: nextCategories});
    };

    const removeSubject = (subject: string) => {
        onFiltersChange({...filters, subjects: filters.subjects.filter((item) => item !== subject)});
    };

    const addSubject = (subject: string) => {
        const cleanSubject = subject.trim().toLowerCase();

        if (!cleanSubject || filters.subjects.includes(cleanSubject)) {
            return;
        }

        onFiltersChange({...filters, subjects: [...filters.subjects, cleanSubject]});
    };

    return (
        <aside className={styles.sidebar} aria-label="Filtros de pesquisa">
            <FilterSection title="Universidade">
                <div className={styles.fieldWithIcon}>
                    <Globe2 size={15}/>
                    <input
                        value={filters.university}
                        placeholder="Escreve a universidade"
                        onChange={(event) => onFiltersChange({...filters, university: event.target.value})}
                    />
                </div>
            </FilterSection>

            <FilterSection title="Categoria">
                <div className={styles.checkboxGroup}>
                    {categories.map((category) => (
                        <label key={category} className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={filters.category.includes(category)}
                                onChange={() => toggleCategory(category)}
                            />
                            <span>{category}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Área">
                <div className={styles.fieldWithIcon}>
                    <Globe2 size={15}/>
                    <input
                        placeholder="Escreve a área"
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                addSubject(event.currentTarget.value);
                                event.currentTarget.value = '';
                            }
                        }}
                    />
                </div>
                <div className={styles.tagList}>
                    {filters.subjects.map((subject) => (
                        <TagPill key={subject} label={subject} onRemove={() => removeSubject(subject)}/>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Data">
                <div className={styles.checkboxGroup}>
                    {yearRanges.map((range) => (
                        <label key={range.label} className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={Boolean(
                                    filters.publicationRange?.[0] === range.value[0] && filters.publicationRange?.[1] === range.value[1]
                                )}
                                onChange={(event) => {
                                    onFiltersChange({
                                        ...filters,
                                        publicationRange: event.target.checked ? range.value : null
                                    });
                                }}
                            />
                            <span>{range.label}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>
        </aside>
    );
}
