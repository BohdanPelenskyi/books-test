import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends ComponentProps<'input'> {
  label: string;
  error?: string;
  endAdornment?: ReactNode;
}

export function Input({ label, error, endAdornment, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors',
            'placeholder:text-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-100',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300',
            endAdornment && 'pr-10',
            className,
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{endAdornment}</div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
