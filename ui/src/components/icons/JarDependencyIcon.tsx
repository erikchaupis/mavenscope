import { cn } from '@/lib/utils';
import jarIconPng from '@/assets/icons/jar-file.png';

interface JarDependencyIconProps {
  className?: string;
  title?: string;
}

/**
 * JAR dependency icon — PNG artwork for dependency trees.
 */
export function JarDependencyIcon({ className, title = 'JAR dependency' }: JarDependencyIconProps) {
  return (
    <img
      src={jarIconPng}
      alt=""
      aria-hidden={title ? undefined : true}
      title={title}
      className={cn('shrink-0 object-contain', className)}
      draggable={false}
    />
  );
}
