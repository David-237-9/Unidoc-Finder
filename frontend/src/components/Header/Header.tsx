import styles from './Header.module.css';

export function Header() {
    return (
        <header className={styles.header}>
            <h1 className={styles.title}>
                <span className={styles.titleStart}>Unidoc</span>
                <span className={styles.titleEnd}>FINDER</span>
            </h1>
        </header>
    );
}
