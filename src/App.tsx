import { useState } from "react";
import { GitHubApiError } from "./api/github";
import Pagination from "./components/Pagination/Pagination";
import RepositoryCard from "./components/RepositoryCard/RepositoryCard";
import SearchBar from "./components/SearchBar/SearchBar";
import { PER_PAGE } from "./constants";
import { useRepositories } from "./hooks/useRepositories";
import { getTotalPages } from "./utils/pagination";
import styles from "./App.module.css";

function getErrorMessage(error: Error): string {
  if (!(error instanceof GitHubApiError)) return "Something went wrong.";

  switch (error.kind) {
    case "rate-limit":
      return "Too many searches. GitHub allows about 10 per minute without signing in. Please wait a minute and try again.";
    case "network":
      return "Couldn't reach GitHub. Check your connection and try again.";
    case "http":
      return `Something went wrong: ${error.message}`;
  }
}

function App() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const { data, error, isEnabled, isPending, isFetching, refetch } =
    useRepositories({ keyword, language: "", sort: "best-match", page });

  function handleSearch(newKeyword: string) {
    setKeyword(newKeyword);
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo(0, 0);
  }

  function renderContent() {
    if (!isEnabled) {
      return (
        <p className={styles.message} role="status">
          Enter a keyword to search GitHub repositories.
        </p>
      );
    }

    if (error) {
      return (
        <div className={styles.message} role="alert">
          <p>{getErrorMessage(error)}</p>
          <button
            className={styles.retryButton}
            type="button"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      );
    }

    if (isPending) {
      return (
        <p className={styles.message} role="status">
          Loading…
        </p>
      );
    }

    if (data.items.length === 0) {
      return (
        <p className={styles.message} role="status">
          No repositories found.
        </p>
      );
    }

    return (
      <>
        <p className={styles.summary} role="status">
          {data.total_count.toLocaleString("en-US")} repositories
          {isFetching && " · Updating…"}
        </p>
        {data.incomplete_results && (
          <p className={styles.note}>
            GitHub returned partial results; some repositories may be missing.
          </p>
        )}
        <ul className={styles.results}>
          {data.items.map((repository) => (
            <li key={repository.id}>
              <RepositoryCard repository={repository} />
            </li>
          ))}
        </ul>
        <Pagination
          page={page}
          totalPages={getTotalPages(data.total_count, PER_PAGE)}
          disabled={isFetching}
          onPageChange={handlePageChange}
        />
      </>
    );
  }

  return (
    <main className={styles.app}>
      <h1>GitHub Repository Explorer</h1>
      <SearchBar onSearch={handleSearch} />
      <section className={styles.content}>
        {renderContent()}
      </section>
    </main>
  );
}

export default App;
