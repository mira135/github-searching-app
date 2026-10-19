import { useState } from "react";
import { GitHubApiError } from "./api/github";
import RepositoryCard from "./components/RepositoryCard/RepositoryCard";
import SearchBar from "./components/SearchBar/SearchBar";
import { useRepositories } from "./hooks/useRepositories";
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

  const { data, error, isEnabled, isPending, isFetching, refetch } =
    useRepositories({ keyword, language: "", sort: "best-match", page: 1 });

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
      </>
    );
  }

  return (
    <main className={styles.app}>
      <h1>GitHub Repository Explorer</h1>
      <SearchBar onSearch={setKeyword} />
      <section className={styles.content}>
        {renderContent()}
      </section>
    </main>
  );
}

export default App;
