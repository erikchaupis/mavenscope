import * as vscode from 'vscode';
import * as path from 'path';

export function getEngineJarPath(extensionPath: string): string {
  const config = vscode.workspace.getConfiguration('mavenscope');
  const override = config.get<string>('enginePath');
  if (override && override.trim().length > 0) {
    return override;
  }
  return path.join(extensionPath, 'engine', 'dependency-engine.jar');
}

export function getEngineLibDir(extensionPath: string): string {
  return path.join(extensionPath, 'engine', 'lib');
}

export function getJavaExecutable(): string {
  return vscode.workspace.getConfiguration('mavenscope').get<string>('javaPath') ?? 'java';
}

export function getBundledEngineRoot(extensionPath: string): string {
  return path.join(extensionPath, 'engine');
}
