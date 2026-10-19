export const PER_PAGE = 20

// `value` goes into the `language:` qualifier; '' means no qualifier.
export const LANGUAGE_OPTIONS = [
  { label: 'All languages', value: '' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'C++', value: 'cpp' },
  { label: 'Rust', value: 'rust' },
  { label: 'Vue', value: 'vue' },
] as const

// `value` is GitHub's `sort` parameter; 'best-match' means omit it.
export const SORT_OPTIONS = [
  { label: 'Best match', value: 'best-match' },
  { label: 'Most stars', value: 'stars' },
  { label: 'Recently updated', value: 'updated' },
  { label: 'Most forks', value: 'forks' },
] as const

export type Language = (typeof LANGUAGE_OPTIONS)[number]['value']
export type SortOption = (typeof SORT_OPTIONS)[number]['value']
