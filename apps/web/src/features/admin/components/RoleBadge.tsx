import { Role } from '@book-exchange/shared';
import { Badge } from '@/components/ui/Badge';

export function RoleBadge({ role }: { role: Role }) {
  return role === Role.ADMIN ? (
    <Badge variant="accent">Адмін</Badge>
  ) : (
    <Badge variant="neutral">Користувач</Badge>
  );
}
