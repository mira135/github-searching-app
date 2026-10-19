import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}

interface ArrowIconProps {
  direction: "left" | "right";
}

function ArrowIcon({ direction }: ArrowIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"} />
    </svg>
  );
}

function Pagination({
  page,
  totalPages,
  disabled,
  onPageChange,
}: PaginationProps) {
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        className={`${styles.button} ${styles.secondary}`}
        type="button"
        aria-label="Previous page"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ArrowIcon direction="left" />
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        className={styles.button}
        type="button"
        aria-label="Next page"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ArrowIcon direction="right" />
      </button>
    </nav>
  );
}

export default Pagination;
