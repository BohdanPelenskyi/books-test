import { cn } from '@/lib/cn';
import { Badge } from './Badge';

interface TabItem<TValue extends string> {
  value: TValue;
  label: string;
  badgeCount?: number;
}

interface TabsProps<TValue extends string> {
  /** Links tabs to their panel; the panel gets the same prefix through getTabPanelProps. */
  idPrefix: string;
  label: string;
  tabs: ReadonlyArray<TabItem<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
  className?: string;
}

export function getTabPanelProps(idPrefix: string, activeValue: string) {
  return {
    id: `${idPrefix}-panel`,
    role: 'tabpanel',
    'aria-labelledby': `${idPrefix}-tab-${activeValue}`,
  } as const;
}

export function Tabs<TValue extends string>({
  idPrefix,
  label,
  tabs,
  value,
  onChange,
  className,
}: TabsProps<TValue>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex gap-1 rounded-lg bg-slate-100 p-1', className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.value}`}
            aria-controls={`${idPrefix}-panel`}
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium',
              isActive ? 'bg-white shadow-sm' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {tab.label}
            {tab.badgeCount ? <Badge variant="accent">{tab.badgeCount}</Badge> : null}
          </button>
        );
      })}
    </div>
  );
}
