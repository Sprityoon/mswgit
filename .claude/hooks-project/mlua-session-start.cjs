#!/usr/bin/env node
'use strict';

// 프로젝트 포크 (2026-07-16) — 벤더 .claude/hooks/mlua-lsp/mlua-session-start.cjs 대체.
// 사유: 벤더판의 fs.readFileSync(0)가 stdin EOF를 무기한 대기 — 하네스가 stdin을 닫지 않는
// 경로(세션 재개·다중 세션 동시 기동 등)에서 SessionStart 훅이 timeout(120s)으로 실패했다.
// 이 포크는 stdin 읽기에 시간 상한(2s)을 두고, 그 외 로직·로그 형식은 벤더와 동일하다.
// 공용 모듈(resolve-cmd/lsp-log)은 벤더 경로를 그대로 require — mswai update를 자동 추종.

const fs = require('fs');
const path = require('path');
const { appendLspLog } = require('../hooks/mlua-lsp/lsp-log.cjs');
const { resolveLspCommand, spawnLspDetached } = require('../hooks/mlua-lsp/resolve-cmd.cjs');

const STDIN_TIMEOUT_MS = 2000;

function readInputBounded(timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const chunks = [];
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { process.stdin.destroy(); } catch (_) {}
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); }
    };
    const timer = setTimeout(finish, timeoutMs);
    try {
      process.stdin.on('data', (c) => chunks.push(c));
      process.stdin.on('end', finish);
      process.stdin.on('error', finish);
    } catch (_) {
      finish();
    }
  });
}

function findProjectRoot(startPath) {
  let current = path.resolve(startPath || process.cwd());
  try {
    if (!fs.statSync(current).isDirectory()) current = path.dirname(current);
  } catch (_) {}

  while (true) {
    if (path.basename(current) === 'RootDesk') return path.dirname(current);
    try {
      if (fs.statSync(path.join(current, 'RootDesk')).isDirectory()) return current;
    } catch (_) {}

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

(async () => {
  const input = await readInputBounded(STDIN_TIMEOUT_MS);
  const projectRoot = process.env.MLUA_LSP_PROJECT_ROOT || findProjectRoot(input.cwd);

  if (!projectRoot) process.exit(0);

  const resolved = resolveLspCommand({ projectRoot });
  const subArgs = ['start', projectRoot];
  const args = resolved.baseArgs.concat(subArgs);

  const startedAt = Date.now();
  const dispatched = spawnLspDetached(resolved, subArgs);
  const durationMs = Date.now() - startedAt;
  const result = dispatched.error ? { error: dispatched.error } : { status: 0, stdout: '', stderr: '' };

  appendLspLog({
    cwd: input.cwd || process.cwd(),
    event: 'SessionStart',
    action: 'start',
    sessionId: input.session_id,
    cmd: resolved.cmd,
    args,
    projectRoot,
    result,
    durationMs,
    summary: {
      cmd_source: resolved.source,
      use_shell: resolved.useShell,
      background: true,
      pid: dispatched.pid,
      fork: 'hooks-project',
    },
  });

  if (dispatched.error) {
    const message = dispatched.error.message || String(dispatched.error);
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `mLua LSP daemon background start failed: ${String(message).trim()}`,
      },
    }));
  }

  process.exit(0);
})();
