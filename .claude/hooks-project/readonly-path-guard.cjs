#!/usr/bin/env node
'use strict';

// Project hook: readonly-path-guard (PreToolUse)
// Promotes AGENTS.md §1 "수정 금지 영역" from a doc rule to an enforced rule.
// Denies WRITE access (Edit/Write/MultiEdit/NotebookEdit, and destructive Bash
// commands) to:
//   - Environment/**            (read allowed, write forbidden)
//   - *.codeblock, *.d.mlua     (auto-generated files)
//   - Global/** except Global/DefaultPlayer.model and Global/WorldConfig.config
//   - vendor skill mirrors      (plugins/msw-maker-base-skill/**, and any
//     .claude/skills/<name>/ or .agents/skills/<name>/ whose <name> is listed
//     in skills-lock.json — hash-locked; edits are clobbered by `mswai update`)
//
// Reads are NOT blocked (looking things up in Environment/*.d.mlua is expected).
//
// Cross-agent usage (harnesses without Claude-Code-style hooks):
//   node readonly-path-guard.cjs --path <file>        → exit 0 allow / exit 2 deny
//   node readonly-path-guard.cjs --command "<shell>"  → exit 0 allow / exit 2 deny
// In CLI mode the deny reason is printed to stderr.
//
// Escape hatch (debugging/migration): MSW_READONLY_GUARD_DISABLE=1

const fs = require('fs');
const path = require('path');

if (process.env.MSW_READONLY_GUARD_DISABLE === '1') process.exit(0);

function toPosix(p) { return String(p || '').replace(/\\/g, '/'); }

function projectRoot(cwd) {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  let cur = path.resolve(cwd || process.cwd());
  for (let i = 0; i < 60; i++) {
    if (fs.existsSync(path.join(cur, 'skills-lock.json')) || fs.existsSync(path.join(cur, '.claude'))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return path.resolve(cwd || process.cwd());
}

function lockedSkillNames(root) {
  try {
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'skills-lock.json'), 'utf8'));
    return Object.keys(lock.skills || {});
  } catch (_) {
    return null; // fall back to msw-* pattern
  }
}

const ALLOWED_GLOBAL = /(^|\/)Global\/(DefaultPlayer\.model|WorldConfig\.config)$/i;

function protectedReason(filePath, root) {
  const p = toPosix(filePath);
  if (!p) return null;
  if (/\.codeblock$/i.test(p) || /\.d\.mlua$/i.test(p)) {
    return '자동 생성 파일(.codeblock/.d.mlua)은 수정 금지입니다. .mlua를 수정하고 maker_refresh_workspace로 재생성하십시오 (AGENTS.md §1).';
  }
  if (/(^|\/)Environment\//i.test(p)) {
    return 'Environment/ 는 읽기 전용입니다(API 정의). 절대 생성·수정·삭제하지 마십시오 (AGENTS.md §1).';
  }
  if (/(^|\/)Global\//i.test(p) && !ALLOWED_GLOBAL.test(p)) {
    return 'Global/ 하위는 DefaultPlayer.model, WorldConfig.config 외 수정 금지입니다. 유저 파일은 RootDesk/MyDesk/ 아래에 두십시오 (AGENTS.md §1).';
  }
  if (/(^|\/)plugins\/msw-maker-base-skill\//i.test(p)) {
    return '벤더 스킬 원본(plugins/msw-maker-base-skill)은 해시 잠금 관리 대상입니다. 수정은 상류 저장소에서, 프로젝트 보완은 docs/agents 또는 프로젝트 스킬에 작성하십시오.';
  }
  const mirror = p.match(/(^|\/)\.(claude|agents)\/skills\/([^/]+)\//i);
  if (mirror) {
    const name = mirror[3];
    const root2 = root || projectRoot();
    const locked = lockedSkillNames(root2);
    const isLocked = locked ? locked.includes(name) : /^msw-/i.test(name);
    // project-owned skills (not in the lock file) are freely editable
    if (isLocked && !/^msw-(conductor|worker|checkpoint)$/i.test(name)) {
      return `'.${mirror[2]}/skills/${name}'은 skills-lock.json으로 관리되는 벤더 스킬 미러입니다. 수정하면 mswai update 시 덮어써집니다 — 프로젝트 레이어(docs/agents, 프로젝트 스킬)에 작성하십시오.`;
    }
  }
  return null;
}

// Destructive shell tokens (reads like cat/grep are NOT listed on purpose).
const WRITE_TOKEN_RE =
  /(^|[\s|;&(`])(rm|del|erase|Remove-Item|ri|mv|move|Move-Item|cp|copy|Copy-Item|tee|touch|New-Item|ni|Set-Content|sc|Add-Content|ac|Out-File|truncate|mkdir|rmdir|rd)([\s|;&)`]|$)/i;
const REDIRECT_RE = />+\s*"?[^\s"'|;&]*(\.codeblock|\.d\.mlua)\b/i;
const PROTECTED_MENTION_RE =
  /((^|[\s"'`=(])(\.?\.?\/)?(Environment|Global)\/|[^\s"'`]*\.codeblock\b|[^\s"'`]*\.d\.mlua\b|plugins\/msw-maker-base-skill\/|\.(claude|agents)\/skills\/msw-[a-z-]+\/)/i;

function commandReason(command) {
  const c = String(command || '');
  if (!c) return null;
  if (REDIRECT_RE.test(c)) {
    return '쉘 리다이렉트로 자동 생성 파일(.codeblock/.d.mlua)에 쓰는 것은 금지입니다 (AGENTS.md §1).';
  }
  if (!WRITE_TOKEN_RE.test(c) || !PROTECTED_MENTION_RE.test(c)) return null;
  // sed -i (in-place edit) also counts as a write
  return '보호 경로(Environment/, Global/, *.codeblock, *.d.mlua, 벤더 스킬)에 대한 파괴적 쉘 명령은 금지입니다. 읽기는 Read/Grep 도구로, 수정은 허용 레인에서만 수행하십시오 (AGENTS.md §1). 오탐이면 MSW_READONLY_GUARD_DISABLE=1 로 우회 후 사유를 보고하십시오.';
}

function denyClaude(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `[readonly-path-guard] ${reason}`,
    },
  }));
  process.exit(0);
}

function denyCli(reason) {
  process.stderr.write(`[readonly-path-guard] DENY: ${reason}\n`);
  process.exit(2);
}

// ---- CLI mode (cross-agent adapters) ----
const argv = process.argv.slice(2);
if (argv.length) {
  const get = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
  const p = get('--path');
  const cmd = get('--command');
  const root = projectRoot(process.cwd());
  if (p) { const r = protectedReason(p, root); if (r) denyCli(r); }
  if (cmd) { const r = commandReason(cmd); if (r) denyCli(r); }
  process.exit(0);
}

// ---- stdin JSON mode (Claude Code PreToolUse) ----
let input = {};
try {
  const raw = fs.readFileSync(0, 'utf8').trim();
  input = raw ? JSON.parse(raw) : {};
} catch (_) { process.exit(0); }

const toolName = input.tool_name || '';
const toolInput = input.tool_input || {};
const root = projectRoot(input.cwd);

if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(toolName)) {
  const filePath = toolInput.file_path || toolInput.path || toolInput.notebook_path || '';
  const r = protectedReason(filePath, root);
  if (r) denyClaude(r);
  process.exit(0);
}

if (toolName === 'Bash') {
  const r = commandReason(toolInput.command);
  if (r) denyClaude(r);
}

process.exit(0);
