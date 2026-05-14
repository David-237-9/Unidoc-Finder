import {ChevronDown} from 'lucide-react';
import type {ReactNode} from 'react';
import styles from './FilterSection.module.css';

interface FilterSectionProps {
    title: string;
    children: ReactNode;
}

export function FilterSection({title, children}: FilterSectionProps) {
    return (
        <section className={styles.section}>
            <button className={styles.header} type="button">
                <span>{title}</span>
                <ChevronDown size={24} strokeWidth={2.5}/>
            </button>
            <div className={styles.content}>{children}</div>
        </section>
    );
}
