export type AppTheme = 'light' | 'dark';

/** Theme implied by the webview shell (`<html class="dark">`) or OS preference in standalone dev. */
export function resolveEditorTheme(): AppTheme {
  if (typeof document !== 'undefined') {
    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    if (document.documentElement.classList.contains('light')) {
      return 'light';
    }
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}
