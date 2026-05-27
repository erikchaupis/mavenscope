import type { AnalysisResult } from './analysis';

/** Extension ↔ webview protocol */
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'analysis'; payload: AnalysisResult }
  | { type: 'loading'; message: string }
  | { type: 'error'; message: string }
  | { type: 'theme'; theme: 'light' | 'dark' };

export type WebviewOutboundMessage =
  | { type: 'ready' }
  | { type: 'selectNode'; nodeId: string }
  | { type: 'refresh' }
  | { type: 'search'; query: string };
