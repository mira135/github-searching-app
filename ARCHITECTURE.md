# GitHub Repository Search — Architecture Plan

## 1. Goal and requirements

Build a small, well-structured GitHub repository search app for a coding test.

**Required:** React, TypeScript, GitHub REST Search API, a design implemented in CSS, and pagination.

**Design principle:** Keep it simple, readable and easy to maintain. Follow good practices, but add abstractions only when they solve a practical problem.

## 2. Scope

### Core features

- Search public GitHub repositories by keyword **or by language alone**.
- Display repository name, owner, description, main language, stars, forks, last-updated date, and a link to GitHub.
- Sort by **Best match, Most stars, Recently updated, or Most forks**.
- Filter by a fixed list of programming languages, with an **All languages** option. No keyword is required when a language is selected.
- Paginate on the server (20 results per page).
- Show appropriate initial, loading, empty, success, and error states.
- Reuse cached pages when users navigate back.
- Handle GitHub rate limits (`403`/`429`) without automatic repeated retries.
- Provide a simple, responsive and accessible design.

### Out of scope for the first version

Authentication, user/code/issue search, repository detail pages, bookmarking, backend proxy, Redux, routing, and keeping the search in the URL. They can be considered later but aren't required for a strong submission.

## 3. Technology choices

| Concern | Choice | Why |
|---|---|---|
| UI | React 19 | Assignment requirement |
| Language | TypeScript | Assignment requirement |
| Tooling | Vite | Small, quick setup (already scaffolded) |
| HTTP | Native `fetch` | No extra client dependency |
| Server data | `@tanstack/react-query` | Fetch lifecycle, caching, retries, cancellation |
| Local UI state | React `useState` | Enough for search form, filters, page |
| Styling | CSS Modules (`*.module.css`) | Standard CSS, locally scoped, supported by Vite |
| Global styling | `index.css` | Resets, tokens, typography |
| Tests | Vitest | Same config as Vite; tests are pure functions, so no DOM library is needed |

CSS Modules satisfy the assignment's *“Implement a design in CSS”* requirement. Vite supports them without special setup.

**TypeScript note:** the scaffold enables `erasableSyntaxOnly`, so `enum` and constructor parameter properties (`constructor(public status: number)`) do not compile. Use string-literal unions and assign class fields explicitly.

## 4. GitHub API

**Single endpoint:**

```http
GET https://api.github.com/search/repositories
```

**Example:**

```http
GET https://api.github.com/search/repositories?q=react+language:typescript&sort=stars&order=desc&per_page=20&page=2
```

| Parameter | Purpose |
|---|---|
| `q` | Required search expression; qualifiers such as `language:typescript` go here |
| `sort` | Optional: `stars`, `updated`, `forks`; omit for GitHub's default best-match relevance |
| `order` | Optional: `asc` or `desc` |
| `per_page` | Results per page: 20 (max 100) |
| `page` | Page number, starting at 1 |

Use this one endpoint for keyword search, language filtering, sorting, and pagination. Do not add endpoints for users, issues, or code.

### Naming

- **keyword** — the text the user submitted (may be empty).
- **`q`** — the combined expression sent to GitHub (keyword + `language:` qualifier).

### Search and filter behavior

The keyword is **optional**. At least one search criterion must be present: a nonempty keyword **or** a language other than All languages.

| Keyword | Language | `q` sent to GitHub |
|---|---|---|
| `react` | All languages | `react` |
| `react` | TypeScript | `react language:typescript` |
| *(empty)* | TypeScript | `language:typescript` |
| *(empty)* | All languages | No request; show a helpful prompt |

Language filtering is not a separate endpoint or query parameter; `language:` is a **qualifier inside `q`**. The keyword is a search term, not a second language constraint: searching `rust` with TypeScript selected returns TypeScript repositories *related to* Rust.

### Language list

A fixed constant. The label is what the user sees; the value is what goes into `language:`.

| Label | Value |
|---|---|
| All languages | *(empty — no qualifier)* |
| TypeScript | `typescript` |
| JavaScript | `javascript` |
| Python | `python` |
| C++ | `cpp` |
| Rust | `rust` |
| Vue | `vue` |

React is intentionally **not** in the list: it is a library, not a language, so `language:react` returns nothing. Users find React projects by typing `react` as the keyword with TypeScript or JavaScript selected.

```ts
// src/constants.ts
export const LANGUAGE_OPTIONS = [
  { label: "All languages", value: "" },
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "C++", value: "cpp" },
  { label: "Rust", value: "rust" },
  { label: "Vue", value: "vue" },
] as const;
```

### Sort options

| Label | Request parameters |
|---|---|
| Best match | Omit `sort` and `order` |
| Most stars | `sort=stars&order=desc` |
| Recently updated | `sort=updated&order=desc` |
| Most forks | `sort=forks&order=desc` |

All ranking and sorting are performed **by GitHub**, not on the client. Best match is GitHub's default relevance ordering and remains the default sort, even though it is less meaningful for language-only searches.

The card shows stars, forks and the last-updated date so the user can see *why* results are in the chosen order. These fields are displayed only; the app never re-sorts or groups results itself.

### Response types

Only the properties the UI uses:

```ts
// src/types/github.ts
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string; // ISO 8601 timestamp
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface RepositorySearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repository[];
}
```

### Limits and considerations

- Unauthenticated search requests are limited to about **10 per minute**. Search limits are separate from general REST API limits.
- Only the **first 1,000 results** of a search are accessible; don't offer pages beyond that.
- `incomplete_results: true` means GitHub returned partial results.
- Public repository search doesn't require authentication.
- Never put a GitHub token in the browser bundle, including `VITE_` environment variables.

**Effective page count:**

```ts
// src/utils/pagination.ts
export const MAX_ACCESSIBLE_RESULTS = 1000;

export function getTotalPages(totalCount: number, perPage: number): number {
  return Math.ceil(Math.min(totalCount, MAX_ACCESSIBLE_RESULTS) / perPage);
}
```

Official docs:
- [Search REST API](https://docs.github.com/en/rest/search/search)
- [Searching repositories](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories)
- [Rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Pagination](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api)

## 5. Error handling

### Error type

`api/github.ts` turns every failure into one small error class. It records **what kind** of failure happened, so components never need to know about HTTP status codes or headers.

```ts
// src/api/github.ts
export type GitHubErrorKind = "rate-limit" | "network" | "http";

export class GitHubApiError extends Error {
  readonly kind: GitHubErrorKind;
  readonly status?: number;

  constructor(kind: GitHubErrorKind, message: string, status?: number) {
    super(message);
    this.name = "GitHubApiError";
    this.kind = kind;
    this.status = status;
  }
}
```

### Classification

| What happened | `kind` |
|---|---|
| `fetch` itself throws (offline, DNS, CORS) | `network` |
| Status `429` | `rate-limit` |
| Status `403` **and** any of: header `x-ratelimit-remaining` is `"0"`, header `retry-after` is present, or the body `message` contains "rate limit" | `rate-limit` |
| Any other non-OK status (other `403`, `422` invalid query, `5xx`, …) | `http` (message taken from the response body when available) |

GitHub sends status `403` both for rate limits and for ordinary access denial, which is why `403` needs the extra checks. The last check (body message) covers GitHub's **secondary** rate limits, which may not set `x-ratelimit-remaining: 0`. GitHub exposes these headers through CORS, so the browser can read them.

### Cancelled requests

TanStack Query cancels obsolete requests automatically (for example when the user clicks Next twice quickly), as long as its `signal` is passed to `fetch`. No extra cancel feature is needed. The only rule: when `fetch` throws an `AbortError`, **rethrow it unchanged** instead of wrapping it as a `network` error. TanStack Query then ignores it and the user never sees a false error.

### Retry policy

Retry only failures that might succeed on a second try, at most twice:

```ts
function shouldRetry(failureCount: number, error: Error): boolean {
  if (!(error instanceof GitHubApiError)) return false;
  const isServerError = error.kind === "http" && (error.status ?? 0) >= 500;
  return (error.kind === "network" || isServerError) && failureCount < 2;
}
```

Rate-limit errors and `4xx` errors are never retried automatically; the user can press **Retry**.

## 6. Component architecture

```text
App
├── SearchBar           search input + submit
├── SearchFilters       language + sort selects
├── RepositoryCard × N  each repository result
└── Pagination          page navigation
```

**Responsibilities:**

- **`App.tsx`** — Owns submitted keyword, language, sort and page state; calls `useRepositories`; renders the appropriate UI state; maps error kinds to user-facing messages.
- **`SearchBar.tsx`** — Owns the draft text and submits a trimmed keyword through `onSearch`. It does not reject empty input; whether a search is valid depends on the language filter, which `App` checks.
- **`SearchFilters.tsx`** — Controlled `<select>`s for language and sort; receives values and `onChange` callbacks; no state of its own.
- **`RepositoryCard.tsx`** — Displays one repository and links to GitHub; no fetching logic.
- **`Pagination.tsx`** — Receives `page`, `totalPages`, `disabled` and `onPageChange`; disables invalid navigation.
- **`useRepositories.ts`** — Connects search parameters to TanStack Query.
- **`api/github.ts`** — Builds `q` and the URL, calls `fetch`, parses responses, and throws `GitHubApiError`.

No separate `RepositoryList` initially: mapping results directly in `App.tsx` is fine. Extract components (for example a status/error message) only if `App.tsx` becomes hard to read.

## 7. Project structure

```text
src/
├── api/
│   ├── github.ts
│   └── github.test.ts
├── components/
│   ├── SearchBar/
│   │   ├── SearchBar.tsx
│   │   └── SearchBar.module.css
│   ├── SearchFilters/
│   │   ├── SearchFilters.tsx
│   │   └── SearchFilters.module.css
│   ├── RepositoryCard/
│   │   ├── RepositoryCard.tsx
│   │   └── RepositoryCard.module.css
│   └── Pagination/
│       ├── Pagination.tsx
│       └── Pagination.module.css
├── hooks/
│   └── useRepositories.ts
├── types/
│   └── github.ts
├── utils/
│   ├── format.ts          number and date formatting
│   ├── pagination.ts
│   └── pagination.test.ts
├── constants.ts           language and sort options, PER_PAGE
├── App.tsx
├── App.module.css
├── index.css
└── main.tsx
```

## 8. Search and pagination mental model

```text
User types in SearchBar
  ↓
Submit (Enter or Search button)
  ↓
App validates: keyword OR language present
  ↓
App saves submitted keyword and sets page = 1
  ↓
useRepositories({ keyword, language, sort, page })
  ↓
TanStack Query checks cache for that exact search key
  ├── Fresh cached result → display immediately, no network request
  └── Missing/stale result → api/github.ts sends GET request
                                    ↓
                           GitHub REST Search API
                                    ↓
                           Data or GitHubApiError
                                    ↓
                           React renders UI state
```

**Two distinct concepts:**
- **Draft text** inside `SearchBar` — what the user is typing.
- **Submitted keyword** in `App` — what is actually searched.

Searching only on submit avoids a network call per keystroke.

**Filters apply to the submitted keyword.** Changing language or sort triggers a new search immediately, using the last *submitted* keyword. Unsubmitted text in the input is not used until the user presses Search.

Changing the submitted keyword, language, or sort resets the page to 1. A keyword-free language search is valid; if the keyword is empty and the language is All, nothing is fetched. Build the URL with `URLSearchParams` so `q` is encoded correctly.

**Pagination is server-side.** Changing page changes the `page` request parameter; the app never fetches all results to paginate them in the browser.

## 9. TanStack Query's role

TanStack Query does **not** replace GitHub's API or `fetch`. It manages the lifecycle around the fetch function.

```ts
// src/hooks/useRepositories.ts
useQuery({
  queryKey: ["repositories", { keyword, language, sort, page }],
  queryFn: ({ signal }) => searchRepositories({ keyword, language, sort, page, signal }),
  enabled: Boolean(keyword || language), // language "" means All languages
  placeholderData: keepPreviousData,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: shouldRetry,
});
```

- **`queryKey`** identifies a unique search and page, so visited pages are reused.
- **`enabled`** prevents a request when there is no search criterion.
- **`placeholderData: keepPreviousData`** keeps the current results visible while the next page loads, instead of flashing a loading state. Use `isFetching` to show a subtle loading indicator and to disable pagination.
- **`staleTime`** lets fresh data render without a refetch.
- **`gcTime`** controls how long inactive results stay in memory.
- **`signal`** lets TanStack Query cancel obsolete requests (see §5).
- **`retry`** never repeats rate-limited or invalid requests.

`QueryClientProvider` wraps `<App />` in `main.tsx`. The cache lives in memory and does not survive a full reload; no separate cache store is needed.

## 10. UI states and edge cases

| Condition | UI behavior |
|---|---|
| Keyword empty AND language is All | Welcome prompt; no request |
| Keyword empty, language chosen | Language-only search |
| First request in progress | Loading state |
| Next page loading | Previous results stay visible, loading indicator, pagination disabled |
| Zero results | “No repositories found” |
| `rate-limit` error | “Too many searches. GitHub allows about 10 per minute without signing in. Please wait a minute and try again.” + Retry |
| `network` error | “Couldn't reach GitHub. Check your connection.” + Retry |
| `http` error | “Something went wrong: {message}” + Retry |
| Cancelled request | Nothing shown |
| `incomplete_results: true` | Small note that results may be incomplete |
| New keyword, filter, or sort | Reset to page 1 |
| Page change | Scroll to top of results |
| Previously visited page still fresh | Render from cache, no request |

Retry calls the query's `refetch()`. A global cooldown scheduler is **not required**; clear feedback and no automatic rate-limit retries are enough for this assignment.

## 11. UI layout

```text
GitHub Repository Explorer
┌──────────────────────────────────────────────┐
│ Search repositories [optional keyword]       │
│                          [ Search ]          │
├──────────────────────┬───────────────────────┤
│ Language             │ Sort by               │
│ All / TS / JS / ...  │ Best match / Stars /  │
│                      │ Updated / Forks       │
├──────────────────────┴───────────────────────┤
│ 1,234 repositories                           │
│ ┌──────────────────────────────────────────┐ │
│ │ owner/name                               │ │
│ │ Description                              │ │
│ │ TypeScript · ★ 12.3k · ⑂ 2.1k · Updated  │ │
│ │ Oct 16, 2026                             │ │
│ └──────────────────────────────────────────┘ │
│ ...                                          │
├──────────────────────────────────────────────┤
│ Previous       Page X of Y           Next    │
└──────────────────────────────────────────────┘
```

Keep the UI simple and responsive, styled with CSS Modules. Selecting a filter or sort changes the request, not the local order of the current page.

**Formatting** (`utils/format.ts`, built on `Intl`, no libraries):
- Star and fork counts in compact form: `12.3k`.
- Updated date as a short absolute date: `Oct 16, 2026`.

**Accessibility basics:**
- A `<label>` for the search input and both selects.
- `aria-live="polite"` on the results count / status line.
- `aria-current="page"` on the current page indicator.
- External links use `target="_blank" rel="noopener noreferrer"`.
- Visible focus styles and sufficient color contrast.

## 12. Implementation steps

1. Clean up the Vite scaffold: remove `App.css`, `src/assets/*` and the template `App.tsx` content; `git init`; add Vitest (`npm i -D vitest`, `"test": "vitest"` script).
2. Add `types/github.ts` and `constants.ts`; build `SearchBar` and `RepositoryCard` with mock data.
3. Implement `api/github.ts`: query building, URL parameters, `GitHubApiError` and classification.
4. Implement `useRepositories` and add `QueryClientProvider` in `main.tsx`.
5. Connect the submitted keyword in `App.tsx` and render loading, empty, error and success states.
6. Add server-side pagination with the 1,000-result ceiling.
7. Add `SearchFilters` (language list and four sort choices); reset the page on changes.
8. Add responsive styles with CSS Modules and global tokens in `index.css`.
9. Add focused tests: `q` construction, `getTotalPages` bounds, and error classification (including `403` rate limit vs. other `403`).
10. Replace the template README with setup instructions and key technical decisions.

## 13. Definition of done

- [ ] Search calls `/search/repositories` with correctly encoded parameters.
- [ ] Empty keyword + chosen language works; empty keyword + All languages makes no request.
- [ ] Language filter uses `language:` inside `q`, with the fixed list from §4.
- [ ] Sort implements Best match, Most stars, Recently updated, and Most forks.
- [ ] Cards show name, owner, description, language, stars, forks, updated date, and a working GitHub link.
- [ ] Filters apply to the submitted keyword; sorting, filtering and pagination work together.
- [ ] Keyword, filter and sort changes reset to page 1.
- [ ] No pages beyond the first 1,000 results.
- [ ] Loading, empty, rate-limit, network and HTTP error states are usable; Retry works.
- [ ] Cancelled requests never show an error.
- [ ] Revisiting a fresh cached page makes no new request.
- [ ] Components contain presentation logic only; API details stay in `api/github.ts`.
- [ ] Types cover the fields in use without unnecessary complexity.
- [ ] CSS Modules scope component styles; global CSS holds reset and tokens.
- [ ] `npm run build`, `npm run lint` and `npm test` pass; README explains how to run the app.

**Bottom line:** One search endpoint, four components, one query hook, one API module with a small error class, and a few pure utility functions. Simple to read, easy to test, and enough for a professional submission.
