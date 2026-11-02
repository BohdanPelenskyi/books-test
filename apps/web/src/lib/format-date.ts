export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
