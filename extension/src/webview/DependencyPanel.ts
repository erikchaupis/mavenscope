import * as vscode from 'vscode';
import type { WebviewOutboundMessage } from '@mavenscope/shared';
import { EngineClient } from '../engine/EngineClient';
import { resolveWorkbenchTheme, webviewHtmlThemeClass, type WebviewTheme } from '../utils/theme';

export class DependencyPanel {
  public static readonly viewType = 'mavenscope.dependencyViewer';
  private panel: vscode.WebviewPanel | undefined;
  private readonly engine: EngineClient;
  private projectPath: string | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext,
  ) {
    this.engine = new EngineClient(context.extensionPath);
  }

  async show(projectPath?: string): Promise<void> {
    this.projectPath = projectPath ?? this.projectPath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        DependencyPanel.viewType,
        'MavenScope Dependencies',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.extensionUri, 'media'),
            vscode.Uri.joinPath(this.extensionUri, 'engine'),
          ],
        },
      );

      this.panel.iconPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'icon.svg');
      this.panel.webview.html = this.getWebviewHtml(this.panel.webview);
      this.panel.onDidDispose(() => this.disposePanel(), null, this.disposables);
      this.panel.webview.onDidReceiveMessage(
        (message: WebviewOutboundMessage) => this.handleMessage(message),
        null,
        this.disposables,
      );
      this.disposables.push(
        vscode.window.onDidChangeActiveColorTheme(() => {
          this.postWorkbenchTheme();
        }),
      );
    }

    this.panel.reveal(vscode.ViewColumn.One);
    await this.runAnalysis();
  }

  async refresh(): Promise<void> {
    if (!this.panel) {
      await this.show();
      return;
    }
    await this.runAnalysis();
  }

  dispose(): void {
    this.panel?.dispose();
    this.disposePanel();
  }

  private disposePanel(): void {
    this.panel = undefined;
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }

  private async handleMessage(message: WebviewOutboundMessage): Promise<void> {
    switch (message.type) {
      case 'ready':
        await this.runAnalysis();
        break;
      case 'refresh':
        await this.runAnalysis();
        break;
      case 'selectNode':
        break;
    }
  }

  private async runAnalysis(): Promise<void> {
    if (!this.panel || !this.projectPath) {
      return;
    }

    this.post({ type: 'loading', message: 'Analyzing Maven project…' });

    try {
      const result = await this.engine.analyze(this.projectPath);
      this.post({ type: 'analysis', payload: result });
      this.panel.title = `MavenScope — ${result.project.artifactId}`;
    } catch (error) {
      this.post({ type: 'error', message: String(error) });
    }
  }

  private post(message: unknown): void {
    void this.panel?.webview.postMessage(message);
  }

  private postWorkbenchTheme(): void {
    this.post({ type: 'theme', theme: resolveWorkbenchTheme() });
  }

  private getWebviewHtml(webview: vscode.Webview): string {
    const config = vscode.workspace.getConfiguration('mavenscope');
    const useDevUi = config.get<boolean>('useDevUi') && this.context.extensionMode === vscode.ExtensionMode.Development;
    const devPort = config.get<number>('devUiPort') ?? 5173;
    const theme = resolveWorkbenchTheme();
    const themeClass = webviewHtmlThemeClass(theme);
    const themeBootstrapScript = this.getThemeBootstrapScript(theme);

    if (useDevUi) {
      const devUri = `http://localhost:${devPort}`;
      return `<!DOCTYPE html>
<html lang="en" class="${themeClass}">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${devUri} https: data:; script-src ${devUri} 'unsafe-inline' 'unsafe-eval'; style-src ${devUri} 'unsafe-inline'; connect-src ${devUri} ws://localhost:${devPort}; font-src ${devUri} https://fonts.gstatic.com data:;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MavenScope</title>
</head>
<body>
  <div id="root"></div>
  ${themeBootstrapScript}
  <script type="module" src="${devUri}/src/main.tsx"></script>
</body>
</html>`;
    }

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'assets', 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'ui', 'assets', 'index.css'));
    const cspSource = webview.cspSource;

    return `<!DOCTYPE html>
<html lang="en" class="${themeClass}">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; script-src ${cspSource} 'unsafe-inline'; style-src ${cspSource} 'unsafe-inline' https://fonts.googleapis.com; font-src ${cspSource} https://fonts.gstatic.com data:;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>MavenScope</title>
</head>
<body>
  <div id="root"></div>
  ${themeBootstrapScript}
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getThemeBootstrapScript(theme: WebviewTheme): string {
    return `<script>
    window.addEventListener('DOMContentLoaded', () => {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({ type: 'theme', theme: '${theme}' });
    });
  </script>`;
  }
}
