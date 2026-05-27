import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGav(groupId: string, artifactId: string, version: string): string {
  return `${groupId}:${artifactId}:${version}`;
}

export function flattenTree<T extends { children: T[] }>(node: T): T[] {
  const result: T[] = [node];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}
