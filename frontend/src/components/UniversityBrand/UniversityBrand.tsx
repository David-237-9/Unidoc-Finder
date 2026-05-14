import styles from './UniversityBrand.module.css';

interface UniversityBrandProps {
    universityName: string;
    fallbackWebsiteUrl?: string;
}

export function UniversityBrand({universityName}: UniversityBrandProps) {

    return (
        <div className={styles.brand} aria-label={`Universidade: ${universityName}`}>

            <span className={styles.name}>{universityName}</span>
        </div>
    );
}
