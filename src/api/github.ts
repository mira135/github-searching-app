import { PER_PAGE, type Language, type SortOption } from "../constants";
import type { RepositorySearchResponse } from "../types/github";

const SEARCH_URL = "https://api.github.com/search/repositories";

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

export interface SearchParams {
  keyword: string;
  language: Language;
  sort: SortOption;
  page: number;
}

export function buildSearchQuery(keyword: string, language: Language): string {
  const parts: string[] = [];
  if (keyword) parts.push(keyword);
  if (language) parts.push(`language:${language}`);
  return parts.join(" ");
}

export function buildSearchUrl({
  keyword,
  language,
  sort,
  page,
}: SearchParams): string {
  const params = new URLSearchParams({
    q: buildSearchQuery(keyword, language),
    per_page: String(PER_PAGE),
    page: String(page),
  });

  if (sort !== "best-match") {
    params.set("sort", sort);
    params.set("order", "desc");
  }

  return `${SEARCH_URL}?${params}`;
}

export async function searchRepositories(
  params: SearchParams,
  signal?: AbortSignal,
): Promise<RepositorySearchResponse> {
  let response: Response;

  try {
    response = await fetch(buildSearchUrl(params), {
      headers: { Accept: "application/vnd.github+json" },
      signal,
    });
  } catch (error) {
    // Cancelled requests are expected; TanStack Query ignores AbortError, so don't wrap it.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new GitHubApiError("network", "Could not reach GitHub.");
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response.json();
}

async function toApiError(response: Response): Promise<GitHubApiError> {
  const message = await readErrorMessage(response);
  const kind = isRateLimited(response, message) ? "rate-limit" : "http";
  return new GitHubApiError(kind, message, response.status);
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `GitHub request failed with status ${response.status}.`;
  try {
    const body: { message?: string } = await response.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

// GitHub returns 403 for both rate limits and other access errors.
// Secondary rate limits may not set x-ratelimit-remaining to 0, hence the extra checks.
function isRateLimited(response: Response, message: string): boolean {
  if (response.status === 429) return true;
  if (response.status !== 403) return false;
  return (
    response.headers.get("x-ratelimit-remaining") === "0" ||
    response.headers.has("retry-after") ||
    message.toLowerCase().includes("rate limit")
  );
}
