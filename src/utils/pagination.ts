// GitHub's Search API only serves the first 1,000 results of any query.
export const MAX_ACCESSIBLE_RESULTS = 1000;

export function getTotalPages(totalCount: number, perPage: number): number {
  return Math.ceil(Math.min(totalCount, MAX_ACCESSIBLE_RESULTS) / perPage);
}
