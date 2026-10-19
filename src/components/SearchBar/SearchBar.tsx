import { useState, type SubmitEvent } from "react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  onSearch: (keyword: string) => void;
}

function SearchBar({ onSearch }: SearchBarProps) {
  const [draft, setDraft] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(draft.trim());
  }

  return (
    <form className={styles.form} role="search" onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="search-keyword">
        Search repositories
      </label>
      <div className={styles.row}>
        <input
          id="search-keyword"
          className={styles.input}
          type="search"
          placeholder="e.g. react"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className={styles.button} type="submit">
          Search
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
