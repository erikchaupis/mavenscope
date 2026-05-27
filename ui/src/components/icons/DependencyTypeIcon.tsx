import type { DependencyNode } from '@mavenscope/shared';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JarDependencyIcon } from './JarDependencyIcon';

interface DependencyTypeIconProps {
  node: Pick<DependencyNode, 'coordinates' | 'role'>;
  className?: string;
}

/** Renders JAR artwork for jar artifacts; generic package icon for other types. */
export function DependencyTypeIcon({ node, className }: DependencyTypeIconProps) {
  const type = (node.coordinates.type || 'jar').toLowerCase();
  const isRoot = node.role === 'root';

  if (!isRoot && (type === 'jar' || type === '')) {
    return <JarDependencyIcon className={cn('h-[17px] w-[14px]', className)} />;
  }

  return <Package className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground', className)} />;
}
