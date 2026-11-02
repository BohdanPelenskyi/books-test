import { useId, type ComponentProps } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends ComponentProps<'textarea'> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'min-h-24 w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-colors',
          'placeholder:text-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-100',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
