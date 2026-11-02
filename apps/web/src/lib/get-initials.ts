const MAX_INITIALS = 2;

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, MAX_INITIALS)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}
