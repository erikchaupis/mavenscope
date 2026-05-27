import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { DependencyPanel } from './webview/DependencyPanel';
import { MavenProjectTreeProvider } from './tree/MavenProjectTreeProvider';

let dependencyPanel: DependencyPanel | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const treeProvider = new MavenProjectTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('mavenscope.projects', treeProvider),
  );

  dependencyPanel = new DependencyPanel(context.extensionUri, context);

  registerCommands(context, {
    openViewer: (projectPath) => dependencyPanel?.show(projectPath),
    refresh: () => dependencyPanel?.refresh(),
    analyzeWorkspace: () => analyzeWorkspace(dependencyPanel),
  });

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => treeProvider.refresh()),
  );
}

export function deactivate(): void {
  dependencyPanel?.dispose();
}

async function analyzeWorkspace(panel: DependencyPanel | undefined): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage('MavenScope: Open a workspace folder first.');
    return;
  }
  await panel?.show(folder.uri.fsPath);
}
