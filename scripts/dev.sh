#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "MavenScope dev workflow"
echo "1. Terminal A: npm run dev:ui"
echo "2. Terminal B: npm run watch:extension"
echo "3. F5 in VS Code/Cursor (Extension Development Host)"
echo "4. Set mavenscope.useDevUi = true for webview HMR"

npm run build:shared
npm run build:engine

rm -rf extension/engine
mkdir -p extension/engine
cp engine/target/dependency-engine/dependency-engine.jar extension/engine/
cp -R engine/target/dependency-engine/lib extension/engine/

echo "Engine copied. Start dev servers and press F5."
