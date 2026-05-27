import type { ProjectInfo } from '@mavenscope/shared';
import { GitBranch, Moon, RefreshCw, Search, Sparkles, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  project?: ProjectInfo;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onThemeToggle: () => void;
  loading: boolean;
  conflictCount: number;
  theme: 'light' | 'dark';
}

export function Toolbar({
  project,
  search,
  onSearchChange,
  onRefresh,
  onThemeToggle,
  loading,
  conflictCount,
  theme,
}: ToolbarProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card/50 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ring/15 text-ring">
          <GitBranch className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight">MavenScope</h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              MVP
            </span>
          </div>
          {project && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {project.groupId}:{project.artifactId}:{project.version}
            </p>
          )}
        </div>
      </div>

      <div className="relative mx-4 min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search dependencies…"
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring transition-shadow placeholder:text-muted-foreground focus:ring-2"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {conflictCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
            <Sparkles className="h-3 w-3" />
            {conflictCount} conflict{conflictCount === 1 ? '' : 's'}
          </span>
        )}
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 transition-transform hover:rotate-12" />
          ) : (
            <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
          )}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50',
          )}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>
    </header>
  );
}
