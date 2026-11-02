import type { BookSort } from '@book-exchange/shared';
import { SORT_OPTIONS } from '../constants';

interface SortSelectProps {
  value: BookSort;
  onChange: (value: BookSort) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as BookSort)}
      aria-label="Сортування"
      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
    >
      {SORT_OPTIONS.map(({ value: optionValue, label }) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}
