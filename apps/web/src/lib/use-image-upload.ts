import { useEffect, useRef, useState, type ChangeEvent } from 'react';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function getImageFileError(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Дозволені лише JPEG, PNG або WebP';
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Розмір файлу не повинен перевищувати 2 МБ';
  }
  return null;
}

/** Validates a chosen image and exposes a local preview URL that is released automatically. */
export function useImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const validationError = getImageFileError(selectedFile);
    setError(validationError);
    if (validationError) {
      event.target.value = '';
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = URL.createObjectURL(selectedFile);
    setPreviewUrl(previewUrlRef.current);
    setFile(selectedFile);
  }

  return { file, error, previewUrl, onChange };
}
