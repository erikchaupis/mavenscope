import type { AnalysisResult, WebviewMessage } from '@mavenscope/shared';

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

export function postToExtension(message: unknown): void {
  vscode?.postMessage(message);
}

export function getWebviewState<T>(): T | undefined {
  return vscode?.getState() as T | undefined;
}

export function setWebviewState<T>(state: T): void {
  vscode?.setState(state);
}

export function subscribeToExtension(
  handler: (message: WebviewMessage) => void,
): () => void {
  const listener = (event: MessageEvent<WebviewMessage>) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

export function isDevMode(): boolean {
  return import.meta.env.DEV && !vscode;
}

export async function loadDevSample(): Promise<AnalysisResult> {
  const response = await fetch('/analysis-result.sample.json');
  if (!response.ok) {
    throw new Error('Sample data not found');
  }
  return response.json();
}
