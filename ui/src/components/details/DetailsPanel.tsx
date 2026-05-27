import type { ComponentType, ReactNode } from 'react';
import type { AnalysisResult, DependencyNode } from '@mavenscope/shared';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Info, Route, Scale, Tag } from 'lucide-react';
import { formatGav } from '@/lib/utils';

interface DetailsPanelProps {
  node: DependencyNode | null;
  analysis: AnalysisResult | null;
}

export function DetailsPanel({ node, analysis }: DetailsPanelProps) {
  const conflict = analysis?.conflicts.find(
    (c) =>
      node &&
      c.coordinates.groupId === node.coordinates.groupId &&
      c.coordinates.artifactId === node.coordinates.artifactId,
  );

  return (
    <section className="flex h-full flex-col bg-card/30">
      <div className="panel-header">
        <Info className="h-4 w-4" />
        Dependency Details
      </div>
      <ScrollArea.Root className="min-h-0 flex-1">
        <ScrollArea.Viewport className="h-full w-full p-4">
          {!node ? (
            <p className="text-sm text-muted-foreground">
              Select a dependency to inspect coordinates, mediation, and inclusion path.
            </p>
          ) : (
            <div className="grid gap-4 animate-fade-in md:grid-cols-2 xl:grid-cols-3">
              <DetailCard title="Coordinates" icon={Tag}>
                <DetailRow label="Group ID" value={node.coordinates.groupId} mono />
                <DetailRow label="Artifact ID" value={node.coordinates.artifactId} mono />
                <DetailRow label="Resolved Version" value={node.resolvedVersion} mono />
                {node.requestedVersion && (
                  <DetailRow label="Requested Version" value={node.requestedVersion} mono />
                )}
                <DetailRow label="Scope" value={node.scope} />
                <DetailRow label="Optional" value={node.optional ? 'Yes' : 'No'} />
                <DetailRow label="Role" value={node.role} />
              </DetailCard>

              <DetailCard title="Inclusion" icon={Route}>
                <DetailRow
                  label="GAV"
                  value={formatGav(node.coordinates.groupId, node.coordinates.artifactId, node.resolvedVersion)}
                  mono
                />
                <DetailRow label="Depth" value={String(node.depth)} />
                {node.exclusions.length > 0 && (
                  <DetailRow
                    label="Exclusions"
                    value={node.exclusions.map((e) => `${e.groupId}:${e.artifactId}`).join(', ')}
                    mono
                  />
                )}
                {node.description && <DetailRow label="Description" value={node.description} />}
                <FutureSlot label="CVE scanning" />
                <FutureSlot label="Upgrade recommendations" />
              </DetailCard>

              <DetailCard title="Conflict & Mediation" icon={Scale}>
                {node.mediation ? (
                  <>
                    <DetailRow label="Strategy" value={node.mediation.strategy} />
                    <DetailRow label="Winner" value={node.mediation.winnerVersion} mono />
                    {node.mediation.loserVersions.length > 0 && (
                      <DetailRow
                        label="Losers"
                        value={node.mediation.loserVersions.join(', ')}
                        mono
                      />
                    )}
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {node.mediation.explanation}
                    </p>
                  </>
                ) : conflict ? (
                  <>
                    <DetailRow label="Winner" value={conflict.winner.version} mono />
                    <DetailRow
                      label="Rejected"
                      value={conflict.losers.map((l) => l.version).join(', ')}
                      mono
                    />
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {conflict.mediation.explanation}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No version conflict detected for this artifact.</p>
                )}
                <FutureSlot label="AI explanation" />
              </DetailCard>
            </div>
          )}
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    </section>
  );
}

function DetailCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-ring" />
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-sm break-all' : 'text-sm'}>{value}</span>
    </div>
  );
}

function FutureSlot({ label }: { label: string }) {
  return (
    <div className="mt-3 rounded-md border border-dashed border-border/80 px-3 py-2 text-xs text-muted-foreground">
      {label} — architecture ready
    </div>
  );
}
