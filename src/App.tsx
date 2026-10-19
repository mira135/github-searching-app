import RepositoryCard from './components/RepositoryCard/RepositoryCard'
import type { Repository } from './types/github'
import styles from './App.module.css'

const mockRepositories: Repository[] = [
  {
    id: 28457823,
    name: 'freeCodeCamp',
    full_name: 'freeCodeCamp/freeCodeCamp',
    html_url: 'https://github.com/freeCodeCamp/freeCodeCamp',
    description:
      "freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming, and computer science for free.",
    language: 'TypeScript',
    stargazers_count: 457477,
    forks_count: 49695,
    updated_at: '2026-10-19T11:55:11Z',
    owner: {
      login: 'freeCodeCamp',
      avatar_url: 'https://avatars.githubusercontent.com/u/9892522?v=4',
    },
  },
  {
    id: 585146387,
    name: 'ui',
    full_name: 'shadcn-ui/ui',
    html_url: 'https://github.com/shadcn-ui/ui',
    description:
      'Composable, accessible components with thoughtful defaults. Build your own component library with code you can customize, extend, and make your own.',
    language: 'TypeScript',
    stargazers_count: 125932,
    forks_count: 13611,
    updated_at: '2026-10-19T11:52:06Z',
    owner: {
      login: 'shadcn-ui',
      avatar_url: 'https://avatars.githubusercontent.com/u/139895814?v=4',
    },
  },
  {
    id: 1,
    name: 'no-description',
    full_name: 'example/no-description',
    html_url: 'https://github.com',
    description: null,
    language: null,
    stargazers_count: 7,
    forks_count: 0,
    updated_at: '2024-01-15T09:00:00Z',
    owner: {
      login: 'example',
      avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
    },
  },
]

function App() {
  return (
    <main className={styles.app}>
      <h1>GitHub Repository Explorer</h1>
      <ul className={styles.results}>
        {mockRepositories.map((repository) => (
          <li key={repository.id}>
            <RepositoryCard repository={repository} />
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
