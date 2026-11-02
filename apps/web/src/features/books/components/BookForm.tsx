'use client';

import { BookStatus, type Book } from '@book-exchange/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTabPanelProps, Tabs } from '@/components/ui/Tabs';
import { ACCEPTED_IMAGE_TYPES, useImageUpload } from '@/lib/use-image-upload';
import type { BookInput } from '../api';
import { bookFormSchema, type BookFormValues } from '../schemas';
import { BookCover } from './BookCover';

type CoverSource = 'file' | 'url';

const COVER_TABS_ID = 'cover';
const COVER_SOURCE_TABS: ReadonlyArray<{ value: CoverSource; label: string }> = [
  { value: 'file', label: 'Файл' },
  { value: 'url', label: 'URL' },
];

interface BookFormProps {
  book?: Book;
  isSubmitting: boolean;
  onSubmit: (input: BookInput) => void;
  onCancel: () => void;
}

function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function BookForm({ book, isSubmitting, onSubmit, onCancel }: BookFormProps) {
  const [coverSource, setCoverSource] = useState<CoverSource>(book?.photoUrl ? 'url' : 'file');
  const [isAvailable, setIsAvailable] = useState(book?.status !== BookStatus.EXCHANGED);
  const coverUpload = useImageUpload();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      name: book?.name ?? '',
      author: book?.author ?? '',
      photoUrl: book?.photoUrl ?? '',
    },
  });

  const [name, photoUrl] = useWatch({ control, name: ['name', 'photoUrl'] });

  function submit(values: BookFormValues) {
    const hasNewUrl =
      coverSource === 'url' && values.photoUrl && values.photoUrl !== book?.photoUrl;
    const hasStatusChanged =
      book !== undefined && isAvailable !== (book.status === BookStatus.AVAILABLE);

    onSubmit({
      name: values.name,
      author: values.author,
      ...(hasNewUrl && { photoUrl: values.photoUrl }),
      ...(coverSource === 'file' && coverUpload.file && { photo: coverUpload.file }),
      ...(hasStatusChanged && {
        status: isAvailable ? BookStatus.AVAILABLE : BookStatus.EXCHANGED,
      }),
    });
  }

  const previewUrl =
    coverSource === 'file'
      ? (coverUpload.previewUrl ?? book?.photoUrl ?? null)
      : isHttpUrl(photoUrl)
        ? photoUrl
        : (book?.photoUrl ?? null);

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <Input label="Назва" error={errors.name?.message} {...register('name')} />
      <Input label="Автор" error={errors.author?.message} {...register('author')} />

      <div className="space-y-2">
        <span className="block text-sm font-medium text-slate-700">Обкладинка (необовʼязково)</span>
        <Tabs
          idPrefix={COVER_TABS_ID}
          label="Джерело обкладинки"
          tabs={COVER_SOURCE_TABS}
          value={coverSource}
          onChange={setCoverSource}
        />

        <div className="flex items-start gap-4">
          <BookCover
            name={name || 'Книга'}
            photoUrl={previewUrl}
            sizes="112px"
            className="w-20 shrink-0 sm:w-28"
          />
          <div {...getTabPanelProps(COVER_TABS_ID, coverSource)} className="min-w-0 flex-1">
            {coverSource === 'file' ? (
              <div className="space-y-1.5">
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={coverUpload.onChange}
                  aria-label="Файл обкладинки"
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-700 hover:file:bg-accent-100"
                />
                <p className="text-xs text-slate-500">JPEG, PNG або WebP, до 2 МБ</p>
                {coverUpload.error && <p className="text-sm text-red-600">{coverUpload.error}</p>}
              </div>
            ) : (
              <Input
                label="Посилання на обкладинку"
                type="url"
                placeholder="https://…"
                error={errors.photoUrl?.message}
                {...register('photoUrl')}
              />
            )}
          </div>
        </div>
      </div>

      {book && (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(event) => setIsAvailable(event.target.checked)}
            className="mt-0.5 size-4 rounded border-slate-300 accent-accent-600"
          />
          <span>
            Доступна для обміну
            <span className="block text-xs text-slate-500">
              Зніміть позначку, якщо книга вже обміняна: вона зникне з каталогу.
            </span>
          </span>
        </label>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Скасувати
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {book ? 'Зберегти' : 'Додати'}
        </Button>
      </div>
    </form>
  );
}
