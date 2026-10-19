import {
  LANGUAGE_OPTIONS,
  SORT_OPTIONS,
  type Language,
  type SortOption,
} from "../../constants";
import styles from "./SearchFilters.module.css";

interface SearchFiltersProps {
  language: Language;
  sort: SortOption;
  onLanguageChange: (language: Language) => void;
  onSortChange: (sort: SortOption) => void;
}

function SearchFilters({
  language,
  sort,
  onLanguageChange,
  onSortChange,
}: SearchFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="language-filter">
          Language
        </label>
        <select
          id="language-filter"
          className={styles.select}
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as Language)}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sort-order">
          Sort by
        </label>
        <select
          id="sort-order"
          className={styles.select}
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SearchFilters;
