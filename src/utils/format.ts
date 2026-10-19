const countFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatCount(count: number): string {
  return countFormatter.format(count);
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
