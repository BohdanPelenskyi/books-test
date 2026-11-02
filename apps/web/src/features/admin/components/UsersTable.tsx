import type { AdminUser } from '@book-exchange/shared';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format-date';
import { RoleBadge } from './RoleBadge';

interface UsersTableProps {
  users: AdminUser[];
  currentUserId: string | undefined;
  onShowBooks: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

const HEADER_CELL =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

export function UsersTable({
  users,
  currentUserId,
  onShowBooks,
  onEdit,
  onDelete,
}: UsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th scope="col" className={HEADER_CELL}>
              Користувач
            </th>
            <th scope="col" className={HEADER_CELL}>
              Email
            </th>
            <th scope="col" className={HEADER_CELL}>
              Роль
            </th>
            <th scope="col" className={`${HEADER_CELL} text-right`}>
              Книги
            </th>
            <th scope="col" className={HEADER_CELL}>
              Реєстрація
            </th>
            <th scope="col" className={`${HEADER_CELL} text-right`}>
              Дії
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            return (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} avatarUrl={user.avatarUrl} />
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{user.booksCount}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Книги користувача ${user.name}`}
                      onClick={() => onShowBooks(user)}
                    >
                      <BookOpen className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Редагувати ${user.name}`}
                      onClick={() => onEdit(user)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Видалити ${user.name}`}
                      title={isCurrentUser ? 'Не можна видалити власний акаунт' : undefined}
                      disabled={isCurrentUser}
                      onClick={() => onDelete(user)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
