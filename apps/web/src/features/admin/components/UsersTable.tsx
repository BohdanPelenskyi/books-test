import type { AdminUser } from '@book-exchange/shared';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format-date';
import { RoleBadge } from './RoleBadge';

interface UserActionHandlers {
  onShowBooks: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

interface UsersTableProps extends UserActionHandlers {
  users: AdminUser[];
  currentUserId: string | undefined;
}

interface UserActionsProps extends UserActionHandlers {
  user: AdminUser;
  isCurrentUser: boolean;
  /** Icon-only buttons fit a table cell; labelled ones are easier to hit on a phone. */
  hasLabels?: boolean;
}

const HEADER_CELL =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const DELETE_FORBIDDEN_HINT = 'Не можна видалити власний акаунт';

function UserActions({
  user,
  isCurrentUser,
  hasLabels = false,
  onShowBooks,
  onEdit,
  onDelete,
}: UserActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Книги користувача ${user.name}`}
        onClick={() => onShowBooks(user)}
      >
        <BookOpen className="size-4" aria-hidden="true" />
        {hasLabels && 'Книги'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Редагувати ${user.name}`}
        onClick={() => onEdit(user)}
      >
        <Pencil className="size-4" aria-hidden="true" />
        {hasLabels && 'Редагувати'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Видалити ${user.name}`}
        title={isCurrentUser ? DELETE_FORBIDDEN_HINT : undefined}
        disabled={isCurrentUser}
        onClick={() => onDelete(user)}
        className="text-red-600 hover:bg-red-50"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {hasLabels && 'Видалити'}
      </Button>
    </div>
  );
}

export function UsersTable({ users, currentUserId, ...handlers }: UsersTableProps) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {users.map((user) => (
          <li
            key={user.id}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-slate-600">{user.email}</p>
              </div>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-xs text-slate-500">
              Книг: {user.booksCount} · Зареєстровано {formatDate(user.createdAt)}
            </p>
            <UserActions
              user={user}
              isCurrentUser={user.id === currentUserId}
              hasLabels
              {...handlers}
            />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
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
            {users.map((user) => (
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
                  <UserActions
                    user={user}
                    isCurrentUser={user.id === currentUserId}
                    {...handlers}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
