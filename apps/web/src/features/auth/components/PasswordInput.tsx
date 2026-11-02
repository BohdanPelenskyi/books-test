'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { Input } from '@/components/ui/Input';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'endAdornment'>;

export function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <Input
      {...props}
      type={isVisible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Приховати пароль' : 'Показати пароль'}
          aria-pressed={isVisible}
          className="rounded-md p-1.5 text-slate-500 hover:text-slate-900"
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      }
    />
  );
}
