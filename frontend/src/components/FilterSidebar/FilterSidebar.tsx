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

export function FilterSidebar({filters, options, onFiltersChange}: FilterSidebarProps) {
    const toggleCategory = (category: string) => {
        const nextCategories = toggleValue(filters.category, category);
        onFiltersChange({...filters, category: nextCategories});
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: currentYear - 1970 + 1 },
        (_, i) => currentYear - i
    );

    return (
        <aside className={styles.sidebar} aria-label="Filtros de pesquisa">
            <FilterSection title="Universidade">
                <div className={styles.fieldWithIcon}>
                    <Globe2 size={15}/>
                    <select
                        value={filters.university}
                        onChange={(event) => onFiltersChange({...filters, university: event.target.value})}
                        aria-label="Selecionar universidade"
                    >
                        <option value="">Todas as universidades</option>
                        {options.universities.map((university) => (
                            <option key={university} value={university}>{university}</option>
                        ))}
                    </select>
                </div>
            </FilterSection>

            <FilterSection title="Tipo">
                <div className={styles.checkboxGroup}>
                    {options.categories.length > 0 ? (
                        options.categories.map((category) => (
                            <label key={category.value} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.category.includes(category.value)}
                                    onChange={() => toggleCategory(category.value)}
                                />
                                <span>{category.label}</span>
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
                        value={filters.subjects}
                        placeholder="Escreve a área de estudo"
                        onChange={(event) => onFiltersChange({...filters, subjects: event.target.value})}
                    />
                </div>
            </FilterSection>

            <FilterSection title="Idioma">
                <div className={styles.fieldWithIcon}>
                    <Globe2 size={15}/>
                    <select
                        value={filters.language}
                        onChange={(event) => onFiltersChange({...filters, language: event.target.value})}
                        aria-label="Selecionar idioma"
                    >
                        <option value="">Todos os idiomas</option>
                        <option value="por">Português</option>
                        <option value="eng">Inglês</option>
                    </select>
                </div>
            </FilterSection>

            <FilterSection title="Ano">
                <div className={styles.fieldWithIcon}>
                    <Globe2 size={15}/>
                    <select
                        value={filters.year}
                        onChange={(event) => onFiltersChange({...filters, year: event.target.value})}
                        aria-label="Selecionar um Ano"
                    >
                        <option value="">Todos os anos</option>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </FilterSection>
        </aside>
    );
}

function toggleValue(values: string[], value: string): string[] {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}


