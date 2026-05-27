import * as vscode from 'vscode';

export type WebviewTheme = 'light' | 'dark';

/** Maps the active VS Code / Cursor color theme to MavenScope light/dark UI. */
export function resolveWorkbenchTheme(): WebviewTheme {
  const kind = vscode.window.activeColorTheme.kind;
  if (kind === vscode.ColorThemeKind.Light || kind === vscode.ColorThemeKind.HighContrastLight) {
    return 'light';
  }
  return 'dark';
}

export function webviewHtmlThemeClass(theme: WebviewTheme): string {
  return theme === 'dark' ? 'dark' : '';
}
