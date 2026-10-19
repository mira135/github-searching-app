import type { Repository } from "../../types/github";
import { formatCount, formatDate } from "../../utils/format";
import styles from "./RepositoryCard.module.css";

interface RepositoryCardProps {
  repository: Repository;
}

function RepositoryCard({ repository }: RepositoryCardProps) {
  const {
    full_name,
    html_url,
    description,
    language,
    stargazers_count,
    forks_count,
    updated_at,
    owner,
  } = repository;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <img
          className={styles.avatar}
          src={owner.avatar_url}
          alt=""
          width={32}
          height={32}
          loading="lazy"
        />
        <h2 className={styles.title}>
          <a href={html_url} target="_blank" rel="noopener noreferrer">
            {full_name}
          </a>
        </h2>
      </div>

      {description && <p className={styles.description}>{description}</p>}

      <ul className={styles.meta}>
        {language && <li>{language}</li>}
        <li>{formatCount(stargazers_count)} stars</li>
        <li>{formatCount(forks_count)} forks</li>
        <li>Updated {formatDate(updated_at)}</li>
      </ul>
    </article>
  );
}

export default RepositoryCard;
