import type { AnalysisResult, DependencyNode, ResolutionEntry } from '@mavenscope/shared';

function gaKey(node: Pick<DependencyNode, 'coordinates'>): string {
  return `${node.coordinates.groupId}:${node.coordinates.artifactId}`;
}

export interface SyncTarget {
  primaryNodeId: string;
  highlightedNodeIds: string[];
  expandedNodeIds: string[];
  gaKey: string;
  effectiveVersion: string;
}

export function findNodeById(node: DependencyNode, id: string): DependencyNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export function collectAncestorIds(tree: DependencyNode, targetId: string): string[] {
  const path: string[] = [];

  function walk(node: DependencyNode): boolean {
    if (node.id === targetId) {
      path.push(node.id);
      return true;
    }
    for (const child of node.children) {
      if (walk(child)) {
        path.push(node.id);
        return true;
      }
    }
    return false;
  }

  walk(tree);
  return path.reverse();
}

export function resolveSyncFromHierarchyNode(
  tree: DependencyNode,
  nodeId: string,
  resolutionIndex?: Record<string, ResolutionEntry>,
): SyncTarget | null {
  const node = findNodeById(tree, nodeId);
  if (!node) return null;

  const key = gaKey(node);
  const entry = resolutionIndex?.[key];
  const primaryNodeId = entry?.winningNodeId ?? nodeId;
  const highlightedNodeIds = entry?.occurrences.map((o) => o.nodeId) ?? [nodeId];

  return {
    primaryNodeId,
    highlightedNodeIds,
    expandedNodeIds: collectAncestorIds(tree, primaryNodeId),
    gaKey: key,
    effectiveVersion: entry?.effectiveVersion ?? node.resolvedVersion,
  };
}

export function resolveSyncFromResolvedRow(
  tree: DependencyNode,
  rowNodeId: string,
  resolutionIndex?: Record<string, ResolutionEntry>,
): SyncTarget | null {
  const rowNode = findNodeById(tree, rowNodeId);
  if (!rowNode) return null;

  const key = gaKey(rowNode);
  const entry = resolutionIndex?.[key];
  const primaryNodeId = entry?.winningNodeId ?? rowNodeId;

  const highlightedNodeIds = entry?.occurrences.map((o) => o.nodeId) ?? [rowNodeId, primaryNodeId];

  return {
    primaryNodeId,
    highlightedNodeIds: [...new Set(highlightedNodeIds)],
    expandedNodeIds: collectAncestorIds(tree, primaryNodeId),
    gaKey: key,
    effectiveVersion: entry?.effectiveVersion ?? rowNode.resolvedVersion,
  };
}

export function buildFallbackResolutionIndex(tree: DependencyNode): Record<string, ResolutionEntry> {
  const index: Record<string, ResolutionEntry> = {};

  function walk(node: DependencyNode) {
    if (node.id !== 'root') {
      const key = gaKey(node);
      const existing = index[key];
      if (!existing) {
        index[key] = {
          gaKey: key,
          effectiveVersion: node.resolvedVersion,
          winningNodeId: node.id,
          winningPath: node.dependencyPath ?? [node.id],
          occurrences: [
            {
              nodeId: node.id,
              version: node.resolvedVersion,
              effectiveVersion: node.effectiveVersion ?? node.resolvedVersion,
              dependencyPath: node.dependencyPath ?? [],
              nodeState: node.nodeState ?? 'active',
              stateLabel: node.stateLabel ?? '',
              activeInClasspath: node.activeInClasspath ?? true,
            },
          ],
        };
      } else {
        existing.occurrences.push({
          nodeId: node.id,
          version: node.resolvedVersion,
          effectiveVersion: node.effectiveVersion ?? node.resolvedVersion,
          dependencyPath: node.dependencyPath ?? [],
          nodeState: node.nodeState ?? 'active',
          stateLabel: node.stateLabel ?? '',
          activeInClasspath: node.activeInClasspath ?? true,
        });
        if ((node.dependencyPath?.length ?? node.depth) < (existing.winningPath?.length ?? 999)) {
          existing.winningNodeId = node.id;
          existing.winningPath = node.dependencyPath ?? [node.id];
          existing.effectiveVersion = node.resolvedVersion;
        }
      }
    }
    node.children.forEach(walk);
  }

  walk(tree);
  return index;
}

export function getResolutionIndex(analysis: AnalysisResult | null): Record<string, ResolutionEntry> {
  if (!analysis) return {};
  return analysis.resolutionIndex ?? buildFallbackResolutionIndex(analysis.resolvedTree);
}
