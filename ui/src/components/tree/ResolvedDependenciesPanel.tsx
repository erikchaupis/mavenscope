import { useMemo } from 'react';
import type { DependencyNode } from '@mavenscope/shared';
import { Eye, EyeOff } from 'lucide-react';
import { DependencyTypeIcon } from '@/components/icons/DependencyTypeIcon';
import {
  getResolvedDependenciesForSelection,
  nodeLabel,
  type SortMode,
  subtreeMatches,
} from '@/lib/dependency-utils';
import { cn } from '@/lib/utils';
import { ScopeBadge } from './ScopeBadge';
import { SortModeButton } from './SortModeButton';

interface ResolvedDependenciesPanelProps {
  tree: DependencyNode | null;
  selectedId: string | null;
  selectedNode: DependencyNode | null;
  resolvedSelectionId: string | null;
  search: string;
  sortMode: SortMode;
  onToggleSort: () => void;
  showGroupId: boolean;
  onToggleGroupId: () => void;
  onSelectResolved: (nodeId: string) => void;
}

export function ResolvedDependenciesPanel({
  tree,
  selectedId,
  selectedNode,
  resolvedSelectionId,
  search,
  sortMode,
  onToggleSort,
  showGroupId,
  onToggleGroupId,
  onSelectResolved,
}: ResolvedDependenciesPanelProps) {
  const rows = useMemo(() => {
    const all = getResolvedDependenciesForSelection(tree, selectedId, sortMode);
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter(({ node }) => subtreeMatches(node, query));
  }, [tree, selectedId, sortMode, search]);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="panel-header shrink-0 justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-0.5">
          <span className="text-foreground">Resolved Dependencies</span>
          <span className="text-xs font-normal">
            {selectedNode
              ? selectedNode.role === 'root'
                ? `All resolved dependencies for ${nodeLabel(selectedNode, showGroupId)}`
                : selectedNode.children.length === 0
                  ? `Effective resolved version for ${nodeLabel(selectedNode, showGroupId)}`
                  : `Transitive dependencies for ${nodeLabel(selectedNode, showGroupId)}`
              : 'Select a dependency in the hierarchy'}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <SortModeButton sortMode={sortMode} onToggle={onToggleSort} variant="full" />
          <button
            type="button"
            onClick={onToggleGroupId}
            title={showGroupId ? 'Hide group IDs' : 'Show group IDs'}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            {showGroupId ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Group ID
          </button>
        </div>
      </div>

      <div className="scroll-panel min-h-0 flex-1 p-2">
        {selectedId && rows.length === 0 && (
          <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            No dependencies match the current search.
          </div>
        )}

        {rows.length > 0 && (
          <ul className="space-y-0.5">
            {rows.map(({ node, depth }) => {
              const showRequested =
                node.requestedVersion && node.requestedVersion !== node.resolvedVersion;
              const indent = sortMode === 'declaration' ? Math.max(0, depth - 1) * 12 + 8 : 8;
              const isSelected = resolvedSelectionId === node.id;

              return (
                <li key={`${node.id}-${depth}-${sortMode}`}>
                  <button
                    type="button"
                    onClick={() => onSelectResolved(node.id)}
                    className={cn(
                      'tree-row w-full text-left',
                      isSelected && 'tree-row-active',
                    )}
                    style={{ paddingLeft: `${indent}px` }}
                  >
                    <DependencyTypeIcon node={node} />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {nodeLabel(node, showGroupId)}
                    </span>
                    <span className="badge-version shrink-0">
                      {node.resolvedVersion || node.coordinates.version}
                    </span>
                    {showRequested && (
                      <span className="badge-version shrink-0 border-warning/40 text-warning line-through">
                        req {node.requestedVersion}
                      </span>
                    )}
                    {node.stateLabel && (
                      <span className="hidden truncate text-[11px] text-muted-foreground xl:inline">
                        ({node.stateLabel})
                      </span>
                    )}
                    <ScopeBadge scope={node.scope} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
