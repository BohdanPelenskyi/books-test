import Image from 'next/image';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/get-initials';

interface AvatarProps {
  name: string;
  avatarUrl: string | null;
  className?: string;
}

const AVATAR_SIZE_PX = 64;

export function Avatar({ name, avatarUrl, className }: AvatarProps) {
  const sizeClasses = cn('size-9 shrink-0 rounded-full', className);

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={AVATAR_SIZE_PX}
        height={AVATAR_SIZE_PX}
        className={cn(sizeClasses, 'object-cover')}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={cn(
        sizeClasses,
        'inline-flex items-center justify-center bg-accent-100 text-sm font-semibold text-accent-700',
      )}
    >
      {getInitials(name)}
    </span>
  );
}
