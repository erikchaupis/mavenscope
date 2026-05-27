import type { DependencyNode } from '@mavenscope/shared';

export type SortMode = 'declaration' | 'alphabetical';

export function nodeLabel(node: DependencyNode, showGroupId = true): string {
  return showGroupId
    ? `${node.coordinates.groupId}:${node.coordinates.artifactId}`
    : node.coordinates.artifactId;
}

export function compareNodes(a: DependencyNode, b: DependencyNode): number {
  const labelCompare = nodeLabel(a).localeCompare(nodeLabel(b), undefined, { sensitivity: 'base' });
  if (labelCompare !== 0) return labelCompare;
  return (a.resolvedVersion || a.coordinates.version).localeCompare(
    b.resolvedVersion || b.coordinates.version,
    undefined,
    { sensitivity: 'base' },
  );
}

export function sortChildren(nodes: DependencyNode[], sortMode: SortMode): DependencyNode[] {
  if (sortMode === 'declaration') return nodes;
  return [...nodes].sort(compareNodes);
}

export interface FlatDependencyRow {
  node: DependencyNode;
  depth: number;
}

export function flattenSubtree(node: DependencyNode, depth = 0): FlatDependencyRow[] {
  const rows: FlatDependencyRow[] = [{ node, depth }];
  for (const child of node.children) {
    rows.push(...flattenSubtree(child, depth + 1));
  }
  return rows;
}

export function getResolvedDependenciesForSelection(
  tree: DependencyNode | null,
  selectedId: string | null,
  sortMode: SortMode,
): FlatDependencyRow[] {
  if (!tree) return [];

  const selected = selectedId ? findNodeInTree(tree, selectedId) : tree;
  if (!selected) return [];

  let rows = flattenSubtree(selected, 0);

  if (selectedId) {
    const transitive = rows.slice(1);
    if (transitive.length === 0) {
      rows = [{ node: selected, depth: 0 }];
    } else {
      rows = transitive;
    }
  } else {
    rows = rows.slice(1);
  }

  if (sortMode === 'alphabetical') {
    return [...rows]
      .sort((a, b) => compareNodes(a.node, b.node))
      .map((row) => ({ ...row, depth: 0 }));
  }
  return rows;
}

function findNodeInTree(node: DependencyNode, id: string): DependencyNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeInTree(child, id);
    if (found) return found;
  }
  return null;
}

export function subtreeMatches(node: DependencyNode, query: string): boolean {
  if (!query) return true;
  const label = `${node.coordinates.groupId}:${node.coordinates.artifactId}:${node.resolvedVersion || node.coordinates.version}:${node.scope}`;
  if (label.toLowerCase().includes(query)) return true;
  return node.children.some((child) => subtreeMatches(child, query));
}

export function scopeBadgeClass(scope: string): string {
  const normalized = (scope || 'compile').toLowerCase();
  switch (normalized) {
    case 'compile':
      return 'scope-badge scope-badge-compile';
    case 'runtime':
      return 'scope-badge scope-badge-runtime';
    case 'test':
      return 'scope-badge scope-badge-test';
    case 'provided':
      return 'scope-badge scope-badge-provided';
    case 'import':
      return 'scope-badge scope-badge-import';
    case 'system':
      return 'scope-badge scope-badge-system';
    default:
      return 'scope-badge scope-badge-default';
  }
}

export function formatScope(scope: string): string {
  return (scope || 'compile').toLowerCase();
}

export function collectExpandableIds(
  node: DependencyNode,
  ids: Set<string> = new Set(),
): Set<string> {
  if (node.children.length > 0) {
    ids.add(node.id);
    for (const child of node.children) {
      collectExpandableIds(child, ids);
    }
  }
  return ids;
}
