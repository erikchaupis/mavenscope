import type { DependencyNode } from '@mavenscope/shared';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AlertTriangle, ChevronRight, Circle, ShieldCheck } from 'lucide-react';
import { DependencyTypeIcon } from '@/components/icons/DependencyTypeIcon';
import { nodeLabel, sortChildren, subtreeMatches, type SortMode } from '@/lib/dependency-utils';
import { cn, formatGav } from '@/lib/utils';
import { ScopeBadge } from './ScopeBadge';

interface DependencyTreeProps {
  node: DependencyNode;
  depth: number;
  search: string;
  selectedId: string | null;
  activeNodeId: string | null;
  highlightedNodeIds: Set<string>;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  sortMode: SortMode;
  showGroupId: boolean;
  registerNodeRef: (id: string, el: HTMLButtonElement | null) => void;
}

export function DependencyTree({
  node,
  depth,
  search,
  selectedId,
  activeNodeId,
  highlightedNodeIds,
  expanded,
  onToggleExpand,
  onSelect,
  sortMode,
  showGroupId,
  registerNodeRef,
}: DependencyTreeProps) {
  const query = search.trim().toLowerCase();
  const label = nodeLabel(node, showGroupId);
  const matchesSelf =
    !query ||
    label.toLowerCase().includes(query) ||
    node.coordinates.groupId.toLowerCase().includes(query) ||
    node.coordinates.artifactId.toLowerCase().includes(query) ||
    node.coordinates.version.toLowerCase().includes(query) ||
    node.scope.toLowerCase().includes(query);

  const matchingChildren = node.children.filter((child) => subtreeMatches(child, query));
  const visible = matchesSelf || matchingChildren.length > 0;
  if (!visible) return null;

  const isExpanded = expanded.has(node.id) || query.length > 0;
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isActive = activeNodeId === node.id;
  const isHighlighted = highlightedNodeIds.has(node.id);
  const isConflictLoser = node.conflictLoser || node.omittedForConflict || node.nodeState === 'conflict-loser';
  const isManaged = node.nodeState === 'managed' || Boolean(node.managedFrom);

  const showRequested =
    node.requestedVersion && node.requestedVersion !== node.resolvedVersion;

  const children = sortChildren(
    query.length > 0 ? matchingChildren : node.children,
    sortMode,
  );

  return (
    <Tooltip.Provider delayDuration={400}>
      <div className="animate-fade-in">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              ref={(el) => registerNodeRef(node.id, el)}
              data-node-id={node.id}
              onClick={() => onSelect(node.id)}
              className={cn(
                'tree-row w-full text-left',
                isSelected && 'tree-row-selected',
                isActive && 'tree-row-active',
                !isActive && isHighlighted && 'tree-row-highlight',
                isConflictLoser && 'tree-row-conflict',
                node.omittedForConflict && 'tree-row-omitted',
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {hasChildren ? (
                <span
                  role="presentation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(node.id);
                  }}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
                >
                  <ChevronRight
                    className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
                  />
                </span>
              ) : (
                <Circle className="ml-0.5 h-2 w-2 shrink-0 fill-muted-foreground/40 text-transparent" />
              )}

              <DependencyTypeIcon node={node} />

              <span className="min-w-0 flex-1 truncate font-medium">{label}</span>

              <span className="badge-version shrink-0">
                {node.resolvedVersion || node.coordinates.version}
              </span>

              {showRequested && (
                <span className="badge-version shrink-0 border-warning/40 text-warning line-through">
                  req {node.requestedVersion}
                </span>
              )}

              {isActive && <span className="status-badge status-badge-active">ACTIVE</span>}
              {isManaged && !isActive && (
                <span className="status-badge status-badge-managed">MANAGED</span>
              )}
              {isConflictLoser && (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive/80" />
              )}
              {node.conflictWinner && !isActive && (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
              )}

              <ScopeBadge scope={node.scope} />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content
            side="right"
            className="z-50 max-w-sm rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md"
          >
            <p className="font-mono">
              {formatGav(node.coordinates.groupId, node.coordinates.artifactId, node.resolvedVersion)}
            </p>
            {node.stateLabel && <p className="mt-1 text-muted-foreground">{node.stateLabel}</p>}
            {node.managedFrom && (
              <p className="mt-1 text-muted-foreground">managed from {node.managedFrom}</p>
            )}
            {node.mediation && (
              <p className="mt-1 text-muted-foreground">{node.mediation.explanation}</p>
            )}
          </Tooltip.Content>
        </Tooltip.Root>

        {node.stateLabel && isHighlighted && (
          <p
            className="truncate px-2 pb-1 text-[11px] text-muted-foreground"
            style={{ paddingLeft: `${depth * 16 + 36}px` }}
          >
            ({node.stateLabel})
          </p>
        )}

        {hasChildren && isExpanded && (
          <div>
            {children.map((child) => (
              <DependencyTree
                key={child.id}
                node={child}
                depth={depth + 1}
                search={search}
                selectedId={selectedId}
                activeNodeId={activeNodeId}
                highlightedNodeIds={highlightedNodeIds}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                sortMode={sortMode}
                showGroupId={showGroupId}
                registerNodeRef={registerNodeRef}
              />
            ))}
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
}
