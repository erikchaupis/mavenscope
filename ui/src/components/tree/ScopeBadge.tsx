import { formatScope, scopeBadgeClass } from '@/lib/dependency-utils';

interface ScopeBadgeProps {
  scope: string;
}

export function ScopeBadge({ scope }: ScopeBadgeProps) {
  const label = formatScope(scope);
  return <span className={scopeBadgeClass(scope)}>[{label}]</span>;
}
