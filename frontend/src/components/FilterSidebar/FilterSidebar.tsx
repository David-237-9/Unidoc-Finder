import {Globe2} from 'lucide-react';
import {FilterSection} from '../FilterSection/FilterSection';
import {TagPill} from '../TagPill/TagPill';
import type {FilterOptions, SearchFilters} from '../../types/document';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
    filters: SearchFilters;
    options: FilterOptions;
    onFiltersChange: (filters: SearchFilters) => void;
}

const fallbackYearRanges: Array<{ label: string; value: [number, number] }> = [
    {label: '2020 - 2029', value: [2020, 2029]},
    {label: '2010 - 2019', value: [2010, 2019]},
    {label: '2000 - 2009', value: [2000, 2009]},
];

export function FilterSidebar({filters, options, onFiltersChange}: FilterSidebarProps) {
    const toggleCategory = (category: string) => {
        const nextCategories = toggleValue(filters.category, category);
        onFiltersChange({...filters, category: nextCategories});
    };

    const toggleLanguage = (language: string) => {
        const nextLanguages = toggleValue(filters.language, language);
        onFiltersChange({...filters, language: nextLanguages});
    };

    const removeSubject = (subject: string) => {
        onFiltersChange({...filters, subjects: filters.subjects.filter((item) => item !== subject)});
    };

    const toggleSubject = (subject: string) => {
        const cleanSubject = normalizeFilterValue(subject);

        if (!cleanSubject) {
            return;
        }

        onFiltersChange({...filters, subjects: toggleValue(filters.subjects, cleanSubject)});
    };

    const addSubject = (subject: string) => {
        const cleanSubject = normalizeFilterValue(subject);

        if (!cleanSubject || filters.subjects.includes(cleanSubject)) {
            return;
        }

        onFiltersChange({...filters, subjects: [...filters.subjects, cleanSubject]});
    };

    const yearRanges = options.yearRanges.length > 0 ? options.yearRanges : fallbackYearRanges;

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

            <FilterSection title="Tipo">
                <div className={styles.checkboxGroup}>
                    {options.categories.length > 0 ? (
                        options.categories.map((category) => (
                            <label key={category} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.category.includes(category)}
                                    onChange={() => toggleCategory(category)}
                                />
                                <span>{category}</span>
                            </label>
                        ))
                    ) : (
                        <p className={styles.hint}>Os tipos aparecem depois da pesquisa.</p>
                    )}
                </div>
            </FilterSection>

            <FilterSection title="Autor">
                <div className={styles.fieldWithIcon}>
                    <Globe2 size={15}/>
                    <input
                        value={filters.author}
                        placeholder="Escreve o autor"
                        onChange={(event) => onFiltersChange({...filters, author: event.target.value})}
                    />
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

                {options.subjects.length > 0 ? (
                    <div className={styles.suggestionList}>
                        {options.subjects.slice(0, 10).map((subject) => {
                            const normalizedSubject = normalizeFilterValue(subject);

                            return (
                                <button
                                    key={subject}
                                    type="button"
                                    className={filters.subjects.includes(normalizedSubject) ? styles.activeSuggestion : styles.suggestion}
                                    onClick={() => toggleSubject(subject)}
                                >
                                    {subject}
                                </button>
                            );
                        })}
                    </div>
                ) : null}

                <div className={styles.tagList}>
                    {filters.subjects.map((subject) => (
                        <TagPill key={subject} label={subject} onRemove={() => removeSubject(subject)}/>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Idioma">
                <div className={styles.checkboxGroup}>
                    {options.languages.length > 0 ? (
                        options.languages.map((language) => (
                            <label key={language} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.language.includes(language)}
                                    onChange={() => toggleLanguage(language)}
                                />
                                <span>{language}</span>
                            </label>
                        ))
                    ) : (
                        <p className={styles.hint}>Os idiomas aparecem depois da pesquisa.</p>
                    )}
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

function toggleValue(values: string[], value: string): string[] {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function normalizeFilterValue(value: string): string {
    return value.trim().toLowerCase();
}
