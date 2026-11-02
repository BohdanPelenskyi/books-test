import { Avatar } from '@/components/ui/Avatar';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/use-image-upload';
import type { ChangeEvent } from 'react';

interface AvatarUploadProps {
  name: string;
  avatarUrl: string | null;
  previewUrl: string | null;
  error: string | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarUpload({ name, avatarUrl, previewUrl, error, onChange }: AvatarUploadProps) {
  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} avatarUrl={previewUrl ?? avatarUrl} className="size-20 text-2xl" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={onChange}
          aria-label="Аватар"
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-700 hover:file:bg-accent-100"
        />
        <p className="text-xs text-slate-500">JPEG, PNG або WebP, до 2 МБ</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
