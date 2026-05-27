import * as vscode from 'vscode';
import * as path from 'path';

interface CommandHandlers {
  openViewer: (projectPath?: string) => Promise<void> | void;
  refresh: () => Promise<void> | void;
  analyzeWorkspace: () => Promise<void> | void;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  handlers: CommandHandlers,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mavenscope.openDependencyViewer', async (uri?: vscode.Uri) => {
      const projectPath = resolveProjectPath(uri);
      if (!projectPath) {
        void vscode.window.showWarningMessage('MavenScope: Select a Maven project or pom.xml.');
        return;
      }
      await handlers.openViewer(projectPath);
    }),
    vscode.commands.registerCommand('mavenscope.refreshAnalysis', () => handlers.refresh()),
    vscode.commands.registerCommand('mavenscope.analyzeWorkspace', () => handlers.analyzeWorkspace()),
  );
}

function resolveProjectPath(uri?: vscode.Uri): string | undefined {
  if (uri?.fsPath) {
    if (uri.fsPath.endsWith('pom.xml')) {
      return path.dirname(uri.fsPath);
    }
    return uri.fsPath;
  }

  const active = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (active?.endsWith('pom.xml')) {
    return path.dirname(active);
  }

  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}
