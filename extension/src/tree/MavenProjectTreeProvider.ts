import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class MavenProjectTreeProvider implements vscode.TreeDataProvider<MavenProjectItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<MavenProjectItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: MavenProjectItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MavenProjectItem): MavenProjectItem[] {
    if (element) {
      return [];
    }

    const folders = vscode.workspace.workspaceFolders ?? [];
    const items: MavenProjectItem[] = [];

    for (const folder of folders) {
      collectMavenProjects(folder.uri.fsPath, items);
    }

    if (items.length === 0 && folders[0]) {
      items.push(
        new MavenProjectItem(
          'No pom.xml found in workspace',
          vscode.TreeItemCollapsibleState.None,
          undefined,
          'info',
        ),
      );
    }

    return items;
  }
}

class MavenProjectItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly projectPath: string | undefined,
    kind: 'project' | 'info' = 'project',
  ) {
    super(label, collapsibleState);
    if (kind === 'project' && projectPath) {
      this.command = {
        command: 'mavenscope.openDependencyViewer',
        title: 'Open Dependency Viewer',
        arguments: [vscode.Uri.file(projectPath)],
      };
      this.contextValue = 'mavenProject';
      this.iconPath = new vscode.ThemeIcon('type-hierarchy');
      this.tooltip = projectPath;
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }
}

function collectMavenProjects(root: string, items: MavenProjectItem[], depth = 0): void {
  if (depth > 4) return;
  const pom = path.join(root, 'pom.xml');
  if (fs.existsSync(pom)) {
    items.push(
      new MavenProjectItem(path.basename(root), vscode.TreeItemCollapsibleState.None, root),
    );
  }

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'target') {
      collectMavenProjects(path.join(root, entry.name), items, depth + 1);
    }
  }
}
