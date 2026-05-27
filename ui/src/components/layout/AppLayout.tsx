import type { AnalysisResult } from '@mavenscope/shared';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { SortMode } from '@/lib/dependency-utils';
import { findNodeById } from '@/lib/sync';
import { Toolbar } from './Toolbar';
import { HierarchyPanel } from '../tree/HierarchyPanel';
import { ResolvedDependenciesPanel } from '../tree/ResolvedDependenciesPanel';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  hierarchySelectedId: string | null;
  resolvedSelectionId: string | null;
  activeNodeId: string | null;
  highlightedNodeIds: string[];
  expanded: Set<string>;
  onExpandedChange: (next: Set<string>) => void;
  scrollToNodeId: string | null;
  onHierarchySelect: (nodeId: string) => void;
  onResolvedSelect: (nodeId: string) => void;
  onRefresh: () => void;
  onThemeToggle: () => void;
  hierarchySortMode: SortMode;
  onToggleHierarchySort: () => void;
  resolvedSortMode: SortMode;
  onToggleResolvedSort: () => void;
  showHierarchyGroupId: boolean;
  onToggleHierarchyGroupId: () => void;
  showResolvedGroupId: boolean;
  onToggleResolvedGroupId: () => void;
  theme: 'light' | 'dark';
}

export function AppLayout({
  analysis,
  loading,
  error,
  search,
  onSearchChange,
  hierarchySelectedId,
  resolvedSelectionId,
  activeNodeId,
  highlightedNodeIds,
  expanded,
  onExpandedChange,
  scrollToNodeId,
  onHierarchySelect,
  onResolvedSelect,
  onRefresh,
  onThemeToggle,
  hierarchySortMode,
  onToggleHierarchySort,
  resolvedSortMode,
  onToggleResolvedSort,
  showHierarchyGroupId,
  onToggleHierarchyGroupId,
  showResolvedGroupId,
  onToggleResolvedGroupId,
  theme,
}: AppLayoutProps) {
  const selectedNode =
    analysis?.resolvedTree && hierarchySelectedId
      ? findNodeById(analysis.resolvedTree, hierarchySelectedId)
      : null;

  return (
    <div className="flex h-full flex-col bg-background">
      <Toolbar
        project={analysis?.project}
        search={search}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
        onThemeToggle={onThemeToggle}
        loading={loading}
        conflictCount={analysis?.conflicts.length ?? 0}
        theme={theme}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg animate-fade-in">
              <Loader2 className="h-4 w-4 animate-spin text-ring" />
              <span className="text-sm text-muted-foreground">Resolving Maven dependencies…</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-x-4 top-4 z-10 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
            {error}
          </div>
        )}

        <PanelGroup direction="horizontal" className="h-full">
          <Panel defaultSize={50} minSize={25}>
            <HierarchyPanel
              tree={analysis?.resolvedTree ?? null}
              search={search}
              selectedId={hierarchySelectedId}
              activeNodeId={activeNodeId}
              highlightedNodeIds={highlightedNodeIds}
              expanded={expanded}
              onExpandedChange={onExpandedChange}
              scrollToNodeId={scrollToNodeId}
              onSelect={onHierarchySelect}
              sortMode={hierarchySortMode}
              onToggleSort={onToggleHierarchySort}
              conflicts={analysis?.conflicts ?? []}
              showGroupId={showHierarchyGroupId}
              onToggleGroupId={onToggleHierarchyGroupId}
            />
          </Panel>
          <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-ring/50 data-[resize-handle-active]:bg-ring" />
          <Panel defaultSize={50} minSize={25}>
            <ResolvedDependenciesPanel
              tree={analysis?.resolvedTree ?? null}
              selectedId={hierarchySelectedId}
              selectedNode={selectedNode}
              resolvedSelectionId={resolvedSelectionId}
              search={search}
              sortMode={resolvedSortMode}
              onToggleSort={onToggleResolvedSort}
              showGroupId={showResolvedGroupId}
              onToggleGroupId={onToggleResolvedGroupId}
              onSelectResolved={onResolvedSelect}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
