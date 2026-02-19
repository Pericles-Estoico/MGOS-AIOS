#!/usr/bin/env node
/**
 * Claude Code Hook: PreCompact Session Digest
 *
 * This hook is registered with Claude Code to trigger before context compact.
 * It delegates to the unified hook runner in aios-core.
 *
 * Installation:
 * - Claude Code automatically discovers hooks in .claude/hooks/
 * - Hook naming: {event}-{name}.js (e.g., precompact-session-digest.js)
 *
 * @see .aios-core/hooks/unified/runners/precompact-runner.js
 * @see Story MIS-3 - Session Digest (PreCompact Hook)
 */

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve path to the unified hook runner
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const runnerPath = join(
  PROJECT_ROOT,
  '.aios-core',
  'hooks',
  'unified',
  'runners',
  'precompact-runner.js',
);

// Load and execute the hook runner
let handler = async () => {
  console.log('[PreCompact Hook] Hook runner not available, skipping');
};

try {
  const { onPreCompact } = await import(runnerPath);
  handler = async (context) => {
    return await onPreCompact(context);
  };
} catch (error) {
  console.error('[PreCompact Hook] Failed to load hook runner:', error.message);
}

export default handler;
