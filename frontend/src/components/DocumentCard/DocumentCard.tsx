import {ExternalLink} from 'lucide-react';
import {TagPill} from '../TagPill/TagPill';
import {UniversityBrand} from '../UniversityBrand/UniversityBrand';
import type {DocumentRecord} from '../../types/document';
import styles from './DocumentCard.module.css';

interface DocumentCardProps {
    document: DocumentRecord;
}

export function DocumentCard({document}: DocumentCardProps) {
    return (
        <article className={styles.card}>
            <div className={styles.year}>{document.year}</div>

            <div className={styles.content}>
                <h2>
                    <a href={document.url} target="_blank" rel="noreferrer">
                        {document.title}
                        <ExternalLink size={15} aria-hidden="true"/>
                    </a>
                </h2>
                <p className={styles.abstract}>{document.abstract}</p>
                <div className={styles.tags}>
                    <TagPill label="tese"/>
                    <TagPill label={`${document.year}`}/>
                </div>
            </div>

            <div className={styles.meta}>
                <span className={styles.typeBadge}>Thesis</span>
                <UniversityBrand universityName={document.universityName}
                                 fallbackWebsiteUrl={document.universityRepoUrl}/>
            </div>
        </article>
    );
}
