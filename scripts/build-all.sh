#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Building shared types"
npm run build:shared

echo "→ Building Java engine"
npm run build:engine

echo "→ Building React UI"
npm run build:ui

echo "→ Copying UI assets to extension"
rm -rf extension/media/ui
mkdir -p extension/media
cp -R ui/dist extension/media/ui

echo "→ Copying engine distribution to extension"
rm -rf extension/engine
mkdir -p extension/engine
cp engine/target/dependency-engine/dependency-engine.jar extension/engine/
cp -R engine/target/dependency-engine/lib extension/engine/

echo "→ Compiling VS Code extension"
npm run build:extension

echo "✓ MavenScope build complete"
