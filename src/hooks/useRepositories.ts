import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  GitHubApiError,
  searchRepositories,
  type SearchParams,
} from "../api/github";

const MAX_RETRIES = 2;

// Rate-limited and 4xx requests would fail again, so only retry network and server errors.
function shouldRetry(failureCount: number, error: Error): boolean {
  if (!(error instanceof GitHubApiError)) return false;
  const isServerError = error.kind === "http" && (error.status ?? 0) >= 500;
  return (error.kind === "network" || isServerError) && failureCount < MAX_RETRIES;
}

export function useRepositories(params: SearchParams) {
  return useQuery({
    queryKey: ["repositories", params],
    queryFn: ({ signal }) => searchRepositories(params, signal),
    enabled: Boolean(params.keyword || params.language),
    placeholderData: keepPreviousData,
    // Reuse visited pages instead of refetching: unauthenticated search allows ~10 requests/minute.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: shouldRetry,
  });
}
