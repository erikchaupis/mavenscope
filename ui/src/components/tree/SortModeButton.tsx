import { ArrowDownAZ } from 'lucide-react';
import type { SortMode } from '@/lib/dependency-utils';
import { cn } from '@/lib/utils';

interface SortModeButtonProps {
  sortMode: SortMode;
  onToggle: () => void;
  /** Left column: icon + "A–Z" when active only. Right column: icon + "A–Z" / "Order". */
  variant: 'compact' | 'full';
}

export function SortModeButton({ sortMode, onToggle, variant }: SortModeButtonProps) {
  const isAlphabetical = sortMode === 'alphabetical';

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isAlphabetical ? 'Sort by declaration order' : 'Sort A–Z'}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
        isAlphabetical
          ? 'border-ring/40 bg-ring/10 text-ring'
          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <ArrowDownAZ className="h-3.5 w-3.5" />
      {variant === 'full' ? (isAlphabetical ? 'A–Z' : 'Order') : isAlphabetical ? 'A–Z' : null}
    </button>
  );
}
