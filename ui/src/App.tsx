import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnalysisResult } from '@mavenscope/shared';
import type { SortMode } from '@/lib/dependency-utils';
import {
  getResolutionIndex,
  resolveSyncFromHierarchyNode,
  resolveSyncFromResolvedRow,
} from '@/lib/sync';
import { AppLayout } from '@/components/layout/AppLayout';
import { resolveEditorTheme, type AppTheme } from '@/lib/theme';
import {
  getWebviewState,
  isDevMode,
  loadDevSample,
  postToExtension,
  setWebviewState,
  subscribeToExtension,
} from '@/vscode';

interface WebviewUiState {
  theme?: AppTheme;
  /** @deprecated use hierarchySortMode / resolvedSortMode */
  sortMode?: SortMode;
  hierarchySortMode?: SortMode;
  resolvedSortMode?: SortMode;
  /** @deprecated use showHierarchyGroupId / showResolvedGroupId */
  showGroupId?: boolean;
  showHierarchyGroupId?: boolean;
  showResolvedGroupId?: boolean;
}

function loadSortModes(): { hierarchy: SortMode; resolved: SortMode } {
  const saved = getWebviewState<WebviewUiState>();
  const legacy = saved?.sortMode ?? 'declaration';
  return {
    hierarchy: saved?.hierarchySortMode ?? legacy,
    resolved: saved?.resolvedSortMode ?? legacy,
  };
}

function loadGroupIdVisibility(): { hierarchy: boolean; resolved: boolean } {
  const saved = getWebviewState<WebviewUiState>();
  const legacy = saved?.showGroupId;
  return {
    hierarchy: saved?.showHierarchyGroupId ?? legacy ?? false,
    resolved: saved?.showResolvedGroupId ?? legacy ?? false,
  };
}

export default function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hierarchySelectedId, setHierarchySelectedId] = useState<string | null>(null);
  const [resolvedSelectionId, setResolvedSelectionId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['root']));
  const [scrollToNodeId, setScrollToNodeId] = useState<string | null>(null);
  const [hierarchySortMode, setHierarchySortMode] = useState<SortMode>(
    () => loadSortModes().hierarchy,
  );
  const [resolvedSortMode, setResolvedSortMode] = useState<SortMode>(
    () => loadSortModes().resolved,
  );
  const [showHierarchyGroupId, setShowHierarchyGroupId] = useState(
    () => loadGroupIdVisibility().hierarchy,
  );
  const [showResolvedGroupId, setShowResolvedGroupId] = useState(
    () => loadGroupIdVisibility().resolved,
  );
  const [theme, setTheme] = useState<AppTheme>(() => {
    return getWebviewState<WebviewUiState>()?.theme ?? resolveEditorTheme();
  });

  const resolutionIndex = useMemo(() => getResolutionIndex(analysis), [analysis]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!isDevMode()) {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (!getWebviewState<WebviewUiState>()?.theme) {
        setTheme(resolveEditorTheme());
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const applySync = useCallback(
    (primaryNodeId: string, highlighted: string[], expandedIds: string[]) => {
      setActiveNodeId(primaryNodeId);
      setHighlightedNodeIds(highlighted);
      setHierarchySelectedId(primaryNodeId);
      setExpanded((prev) => {
        const next = new Set(prev);
        expandedIds.forEach((id) => next.add(id));
        return next;
      });
      setScrollToNodeId(primaryNodeId);
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = subscribeToExtension((message) => {
      switch (message.type) {
        case 'analysis':
          setAnalysis(message.payload);
          setLoading(false);
          setError(null);
          setHierarchySelectedId(message.payload.resolvedTree?.id ?? 'root');
          setResolvedSelectionId(null);
          setActiveNodeId(null);
          setHighlightedNodeIds([]);
          setExpanded(new Set([message.payload.resolvedTree?.id ?? 'root']));
          setScrollToNodeId(null);
          break;
        case 'loading':
          setLoading(true);
          setError(null);
          break;
        case 'error':
          setError(message.message);
          setLoading(false);
          break;
        case 'theme': {
          const saved = getWebviewState<WebviewUiState>()?.theme;
          if (!saved) {
            setTheme(message.theme);
          }
          break;
        }
      }
    });

    postToExtension({ type: 'ready' });

    if (isDevMode()) {
      loadDevSample()
        .then((sample) => {
          setAnalysis(sample);
          setHierarchySelectedId(sample.resolvedTree?.id ?? 'root');
          setExpanded(new Set([sample.resolvedTree?.id ?? 'root']));
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load dev sample data');
          setLoading(false);
        });
    }

    return unsubscribe;
  }, []);

  const handleRefresh = useCallback(() => {
    postToExtension({ type: 'refresh' });
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      setWebviewState<WebviewUiState>({
        ...getWebviewState<WebviewUiState>(),
        theme: next,
      });
      return next;
    });
  }, []);

  const handleToggleHierarchySort = useCallback(() => {
    setHierarchySortMode((current) => {
      const next = current === 'alphabetical' ? 'declaration' : 'alphabetical';
      setWebviewState<WebviewUiState>({
        ...getWebviewState<WebviewUiState>(),
        hierarchySortMode: next,
      });
      return next;
    });
  }, []);

  const handleToggleResolvedSort = useCallback(() => {
    setResolvedSortMode((current) => {
      const next = current === 'alphabetical' ? 'declaration' : 'alphabetical';
      setWebviewState<WebviewUiState>({
        ...getWebviewState<WebviewUiState>(),
        resolvedSortMode: next,
      });
      return next;
    });
  }, []);

  const handleToggleHierarchyGroupId = useCallback(() => {
    setShowHierarchyGroupId((current) => {
      const next = !current;
      setWebviewState<WebviewUiState>({
        ...getWebviewState<WebviewUiState>(),
        showHierarchyGroupId: next,
      });
      return next;
    });
  }, []);

  const handleToggleResolvedGroupId = useCallback(() => {
    setShowResolvedGroupId((current) => {
      const next = !current;
      setWebviewState<WebviewUiState>({
        ...getWebviewState<WebviewUiState>(),
        showResolvedGroupId: next,
      });
      return next;
    });
  }, []);

  const handleHierarchySelect = useCallback(
    (nodeId: string) => {
      setHierarchySelectedId(nodeId);
      setResolvedSelectionId(null);

      if (!analysis?.resolvedTree) return;
      const sync = resolveSyncFromHierarchyNode(
        analysis.resolvedTree,
        nodeId,
        resolutionIndex,
      );
      if (sync) {
        setActiveNodeId(sync.primaryNodeId);
        setHighlightedNodeIds(sync.highlightedNodeIds);
        setExpanded((prev) => {
          const next = new Set(prev);
          sync.expandedNodeIds.forEach((id) => next.add(id));
          return next;
        });
        if (sync.primaryNodeId !== nodeId) {
          setScrollToNodeId(sync.primaryNodeId);
        } else {
          setScrollToNodeId(null);
        }
      }
      postToExtension({ type: 'selectNode', nodeId });
    },
    [analysis?.resolvedTree, resolutionIndex],
  );

  const handleResolvedSelect = useCallback(
    (nodeId: string) => {
      setResolvedSelectionId(nodeId);
      if (!analysis?.resolvedTree) return;

      const sync = resolveSyncFromResolvedRow(
        analysis.resolvedTree,
        nodeId,
        resolutionIndex,
      );
      if (sync) {
        applySync(sync.primaryNodeId, sync.highlightedNodeIds, sync.expandedNodeIds);
      }
      postToExtension({ type: 'selectNode', nodeId: sync?.primaryNodeId ?? nodeId });
    },
    [analysis?.resolvedTree, resolutionIndex, applySync],
  );

  return (
    <AppLayout
      analysis={analysis}
      loading={loading}
      error={error}
      search={search}
      onSearchChange={setSearch}
      hierarchySelectedId={hierarchySelectedId}
      resolvedSelectionId={resolvedSelectionId}
      activeNodeId={activeNodeId}
      highlightedNodeIds={highlightedNodeIds}
      expanded={expanded}
      onExpandedChange={setExpanded}
      scrollToNodeId={scrollToNodeId}
      onHierarchySelect={handleHierarchySelect}
      onResolvedSelect={handleResolvedSelect}
      onRefresh={handleRefresh}
      onThemeToggle={handleThemeToggle}
      hierarchySortMode={hierarchySortMode}
      onToggleHierarchySort={handleToggleHierarchySort}
      resolvedSortMode={resolvedSortMode}
      onToggleResolvedSort={handleToggleResolvedSort}
      showHierarchyGroupId={showHierarchyGroupId}
      onToggleHierarchyGroupId={handleToggleHierarchyGroupId}
      showResolvedGroupId={showResolvedGroupId}
      onToggleResolvedGroupId={handleToggleResolvedGroupId}
      theme={theme}
    />
  );
}
