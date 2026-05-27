import { useCallback, useEffect, useRef } from 'react';
import type { ConflictInfo, DependencyNode } from '@mavenscope/shared';
import { ChevronsDownUp, ChevronsUpDown, Eye, EyeOff } from 'lucide-react';
import { collectExpandableIds, type SortMode } from '@/lib/dependency-utils';
import { cn } from '@/lib/utils';
import { DependencyTree } from './DependencyTree';
import { SortModeButton } from './SortModeButton';

interface HierarchyPanelProps {
  tree: DependencyNode | null;
  search: string;
  selectedId: string | null;
  activeNodeId: string | null;
  highlightedNodeIds: string[];
  expanded: Set<string>;
  onExpandedChange: (next: Set<string>) => void;
  scrollToNodeId: string | null;
  onSelect: (nodeId: string) => void;
  sortMode: SortMode;
  onToggleSort: () => void;
  conflicts: ConflictInfo[];
  showGroupId: boolean;
  onToggleGroupId: () => void;
}

export function HierarchyPanel({
  tree,
  search,
  selectedId,
  activeNodeId,
  highlightedNodeIds,
  expanded,
  onExpandedChange,
  scrollToNodeId,
  onSelect,
  sortMode,
  onToggleSort,
  showGroupId,
  onToggleGroupId,
}: HierarchyPanelProps) {
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const registerNodeRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (!scrollToNodeId) return;
    const el = nodeRefs.current.get(scrollToNodeId);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [scrollToNodeId, expanded, tree?.id]);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onExpandedChange(next);
  };

  const expandAll = () => {
    if (!tree) return;
    onExpandedChange(collectExpandableIds(tree));
  };

  const collapseAll = () => {
    onExpandedChange(new Set(['root']));
  };

  const highlightSet = new Set(highlightedNodeIds);

  return (
    <section className="flex h-full min-h-0 flex-col border-r border-border">
      <div className="panel-header shrink-0 justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-0.5">
          <span className="text-foreground">Dependency Hierarchy</span>
          <span className="text-xs font-normal">Effective resolved Maven tree</span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <SortModeButton sortMode={sortMode} onToggle={onToggleSort} variant="compact" />
          <button
            type="button"
            onClick={onToggleGroupId}
            title={showGroupId ? 'Hide group IDs' : 'Show group IDs'}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            {showGroupId ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Group ID
          </button>
          <button
            type="button"
            onClick={expandAll}
            disabled={!tree}
            title="Expand all"
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50',
            )}
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            disabled={!tree}
            title="Collapse all"
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50',
            )}
          >
            <ChevronsDownUp className="h-3.5 w-3.5" />
            Collapse all
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="scroll-panel min-h-0 flex-1 p-2">
        {tree ? (
          <DependencyTree
            node={tree}
            depth={0}
            search={search}
            selectedId={selectedId}
            activeNodeId={activeNodeId}
            highlightedNodeIds={highlightSet}
            expanded={expanded}
            onToggleExpand={toggleExpand}
            onSelect={onSelect}
            sortMode={sortMode}
            showGroupId={showGroupId}
            registerNodeRef={registerNodeRef}
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No dependency data
          </div>
        )}
      </div>
    </section>
  );
}
