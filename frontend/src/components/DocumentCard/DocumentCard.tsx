import {ExternalLink, FileText} from 'lucide-react';
import {TagPill} from '../TagPill/TagPill';
import {UniversityBrand} from '../UniversityBrand/UniversityBrand';
import type {DocumentRecord} from '../../types/document';
import styles from './DocumentCard.module.css';

interface DocumentCardProps {
    document: DocumentRecord;
}

export function DocumentCard({document}: DocumentCardProps) {
    const yearLabel = document.year ?? 's.d.';
    const subjectTags = document.subjects.slice(0, 4);
    const hasResultUrl = document.url && document.url !== '#';
    const hasFileUrl = Boolean(document.fileUrl && document.fileUrl !== document.url);

    return (
        <article className={styles.card}>
            <div className={styles.year}>{yearLabel}</div>

            <div className={styles.content}>
                <h2>
                    {hasResultUrl ? (
                        <a className={styles.titleLink} href={document.url} target="_blank" rel="noreferrer">
                            <span className={styles.titleText}>{document.title}</span>
                            <ExternalLink className={styles.externalLinkIcon} size={16} aria-hidden="true"/>
                        </a>
                    ) : (
                        <span>{document.title}</span>
                    )}
                </h2>

                {document.authors.length > 0 ? (
                    <p className={styles.details}>Por: {document.authors.join(', ')}</p>
                ) : null}

                <p className={styles.abstract}>{document.abstract}</p>

                <div className={styles.tags}>
                    {document.language && document.language !== 'Unknown' ? <TagPill label={document.language}/> : null}
                    {document.year ? <TagPill label={`${document.year}`}/> : null}
                    {subjectTags.map((subject) => (
                        <TagPill key={subject} label={subject}/>
                    ))}
                </div>

                {hasFileUrl ? (
                    <a className={styles.fileLink} href={document.fileUrl ?? undefined} target="_blank" rel="noreferrer">
                        <FileText size={14} aria-hidden="true"/>
                        Abrir ficheiro
                    </a>
                ) : null}
            </div>

            <div className={styles.meta}>
                <span className={styles.typeBadge}>{document.type}</span>
                <UniversityBrand
                    universityName={document.universityName}
                    fallbackWebsiteUrl={document.universityRepoUrl}
                />
            </div>
        </article>
    );
}
