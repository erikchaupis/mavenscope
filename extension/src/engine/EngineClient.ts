import { spawn } from 'child_process';
import type { AnalysisResult } from '@mavenscope/shared';
import * as path from 'path';
import { getEngineJarPath, getJavaExecutable } from '../utils/paths';

export class EngineClient {
  constructor(private readonly extensionPath: string) {}

  async analyze(projectPath: string, options?: { offline?: boolean }): Promise<AnalysisResult> {
    const java = getJavaExecutable();
    const engineJar = getEngineJarPath(this.extensionPath);
    const engineDir = path.dirname(engineJar);

    const args = ['-jar', engineJar, 'analyze', projectPath];
    if (options?.offline) {
      args.push('--offline');
    }

    return new Promise((resolve, reject) => {
      const child = spawn(java, args, {
        cwd: engineDir,
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => reject(error));
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || `Engine exited with code ${code}`));
          return;
        }

        try {
          const jsonStart = stdout.indexOf('{');
          const payload = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;
          resolve(JSON.parse(payload) as AnalysisResult);
        } catch (error) {
          reject(new Error(`Failed to parse engine JSON: ${String(error)}\n${stdout}`));
        }
      });
    });
  }
}
