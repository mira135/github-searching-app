# GitHub Repository Explorer

A small React + TypeScript app for searching public GitHub repositories, built on the [GitHub Search REST API](https://docs.github.com/en/rest/search/search).

## Features

- Search repositories by keyword, by language, or both
- Filter by language: TypeScript, JavaScript, Python, C++, Rust, Vue
- Sort by best match, most stars, recently updated, or most forks
- Server-side pagination (20 results per page)
- Cached pages: going back to a visited page doesn't send a new request
- Clear loading, empty, and error states, including GitHub's rate limit
- Responsive layout

## How to start the app

Requires **Node.js 22.22+ or 24.15+**.

```bash
cd github-searching-app
npm install
npm run dev
```

Then open the URL printed in the terminal (usually http://localhost:5173).

Other commands:

| Command | Description |
|---|---|
| `npm test` | Run the tests (Vitest) |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |

No GitHub token is needed. Without one, GitHub allows about **10 searches per minute**.

## Tech stack

- **React 19** and **TypeScript**, set up with **Vite**
- **TanStack Query** for fetching, caching, retries, and request cancellation
- **CSS Modules** for component styles, with shared design tokens in `index.css`
- **Vitest** and **React Testing Library** for tests

## Project structure

```text
src/
├── api/github.ts             GitHub requests and error handling
├── hooks/useRepositories.ts  TanStack Query hook
├── components/               Button, SearchBar, SearchFilters, RepositoryCard, Pagination
├── types/github.ts           Types for the fields the UI uses
├── utils/                    Formatting and pagination helpers
└── constants.ts              Language and sort options
```

## Key decisions

- **One endpoint.** Search, language filtering, sorting, and pagination all use `GET /search/repositories`. The language filter is a `language:` qualifier inside the `q` parameter.
- **Search on submit.** Typing doesn't send requests; pressing Search or Enter does. Changing a filter or sort reruns the last submitted search and resets to page 1.
- **Rate limits.** GitHub returns `403` or `429` when the limit is hit. Those requests are never retried automatically, and the user sees a clear message. Only network and server errors are retried.
- **1,000-result limit.** GitHub serves only the first 1,000 results of any search, so pagination stops at page 50.
- **No token in the browser.** A token in frontend code would be visible to anyone, so the app uses unauthenticated requests.

## What could be improved further

- **Keep the search in the URL**, so refresh, the Back button, and sharing a link all work.
- **Show when the rate limit resets** (GitHub sends the exact time) and disable Retry until then.
- **Request smaller avatars.** GitHub returns full-size images; adding a size parameter would save bandwidth.
- **Explain the 1,000-result limit** in the UI, since the total count can be in the millions.
- **Handle qualifiers typed into the search box**, such as `language:go`, which can conflict with the language dropdown.
- **Move keyboard focus to the results** after changing pages.
- **Friendlier error messages** instead of GitHub's raw text, and skeleton cards while loading.
- **Improve color contrast** of the orange pagination buttons.
- **Add tests for `App`** covering the full search flow and error states.
