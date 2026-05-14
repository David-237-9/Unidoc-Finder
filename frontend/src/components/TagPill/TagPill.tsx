import styles from './TagPill.module.css';

interface TagPillProps {
    label: string;
    onRemove?: () => void;
}

export function TagPill({label, onRemove}: TagPillProps) {
    return (
        <span className={styles.tag}>
      {label}
            {onRemove ? (
                <button type="button" onClick={onRemove} aria-label={`Remover ${label}`}>
                    ×
                </button>
            ) : null}
    </span>
    );
}
