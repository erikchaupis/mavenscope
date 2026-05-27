/** JSON contract between Java engine, VS Code extension, and React webview. */

export type ConflictKind =
  | 'version'
  | 'scope'
  | 'managed'
  | 'excluded'
  | 'omitted';

export type NodeRole = 'root' | 'declared' | 'transitive' | 'managed' | 'import';

export type NodeState =
  | 'active'
  | 'declared'
  | 'managed'
  | 'conflict-loser'
  | 'omitted'
  | 'unknown';

export type MediationStrategy =
  | 'nearest-wins'
  | 'dependency-management'
  | 'explicit-override'
  | 'import-bom'
  | 'unknown';

export interface AnalysisMetadata {
  analyzedAt: string;
  projectPath: string;
  mavenVersion: string;
  resolverVersion: string;
  durationMs: number;
  moduleCount: number;
  warnings: string[];
}

export interface ProjectInfo {
  groupId: string;
  artifactId: string;
  version: string;
  packaging: string;
  name?: string;
  description?: string;
  modules?: string[];
}

export interface ExclusionInfo {
  groupId: string;
  artifactId: string;
}

export interface DependencyCoordinates {
  groupId: string;
  artifactId: string;
  version: string;
  classifier?: string;
  type?: string;
}

export interface DependencyNode {
  id: string;
  coordinates: DependencyCoordinates;
  scope: string;
  optional: boolean;
  role: NodeRole;
  depth: number;
  exclusions: ExclusionInfo[];
  dependencyPath?: string[];
  children: DependencyNode[];
  requestedVersion?: string;
  resolvedVersion: string;
  effectiveVersion?: string;
  nodeState?: NodeState;
  stateLabel?: string;
  managedFrom?: string;
  conflictWinner?: boolean;
  conflictLoser?: boolean;
  omittedForConflict?: boolean;
  activeInClasspath?: boolean;
  mediation?: MediationInfo;
  paths?: string[][];
  description?: string;
}

export interface MediationInfo {
  strategy: MediationStrategy;
  winnerVersion: string;
  loserVersions: string[];
  explanation: string;
}

export interface ConflictInfo {
  id: string;
  kind: ConflictKind;
  coordinates: Pick<DependencyCoordinates, 'groupId' | 'artifactId'>;
  winner: DependencyCoordinates;
  losers: DependencyCoordinates[];
  mediation: MediationInfo;
  paths: string[][];
}

export interface ResolutionOccurrence {
  nodeId: string;
  version: string;
  effectiveVersion: string;
  dependencyPath: string[];
  nodeState: string;
  stateLabel: string;
  activeInClasspath: boolean;
}

export interface ResolutionEntry {
  gaKey: string;
  effectiveVersion: string;
  winningNodeId: string;
  winningPath: string[];
  occurrences: ResolutionOccurrence[];
}

export interface AnalysisResult {
  schemaVersion: 1 | 2;
  project: ProjectInfo;
  declaredTree: DependencyNode;
  resolvedTree: DependencyNode;
  conflicts: ConflictInfo[];
  resolutionIndex?: Record<string, ResolutionEntry>;
  metadata: AnalysisMetadata;
}

export function gaKey(node: Pick<DependencyNode, 'coordinates'>): string {
  return `${node.coordinates.groupId}:${node.coordinates.artifactId}`;
}

export function gaVersionKey(groupId: string, artifactId: string, version: string): string {
  return `${groupId}:${artifactId}@${version}`;
}
