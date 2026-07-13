#!/usr/bin/env node
'use strict';

// Project fork of the vendor skill-read-guard (PreToolUse, matcher: "Bash").
// The vendor version only guards 'plugins/msw-maker-base-skill/skills/**/*.md',
// but this workspace mirrors skills into '.claude/skills/' and '.agents/skills/'
// as well — partial shell reads there had the exact same failure mode (only a
// prefix of a reference gets read and the answering section is silently skipped).
// This fork blocks all three roots. Everything else matches the vendor contract.
//
// Cross-agent usage:
//   node skill-read-guard.cjs --command "<shell command>"  → exit 0 allow / 2 deny
//
// Escape hatch: MSW_SKILL_READ_GUARD_DISABLE=1

const fs = require('fs');

if (process.env.MSW_SKILL_READ_GUARD_DISABLE === '1') process.exit(0);

const BLOCKED_TOKEN_RE =
  /(^|[\s|;&(`])(cat|head|tail|less|more|type|Get-Content|gc|grep|rg|findstr|Select-String|sls|awk|sed)([\s|;&)`]|$)/i;

// plugins/msw-maker-base-skill/skills/**.md  |  .claude/skills/**.md  |  .agents/skills/**.md
const SKILL_PATH_RE =
  /((plugins[\/\\]+msw-maker-base-skill[\/\\]+skills)|(\.claude[\/\\]+skills)|(\.agents[\/\\]+skills))[\/\\]+[^\s'"`|;&()<>]*\.md\b/i;

function check(command) {
  if (!command) return null;
  if (!BLOCKED_TOKEN_RE.test(command)) return null;
  const m = command.match(SKILL_PATH_RE);
  if (!m) return null;
  return m[0].replace(/\\/g, '/');
}

function denyMessage(matchedPath, command) {
  return (
    `[skill-read-guard] Refusing to read a skill file via shell.\n` +
    `File:    ${matchedPath}\n` +
    `Command: ${command}\n` +
    `Reason:  Skill/reference .md files must be read IN FULL via the Read tool\n` +
    `         (no offset/limit). Shell reads show only a partial slice and\n` +
    `         silently skip the section that answers the request.\n` +
    `Action:  Load the skill via your agent's skill system, then issue a single\n` +
    `         full Read call on the reference path. For metadata only\n` +
    `         (line counts, sizes), wc/stat/ls are allowed.\n`
  );
}

const argv = process.argv.slice(2);
if (argv.length) {
  const i = argv.indexOf('--command');
  const cmd = i >= 0 ? argv[i + 1] : argv.join(' ');
  const hit = check(cmd);
  if (hit) { process.stderr.write(denyMessage(hit, cmd)); process.exit(2); }
  process.exit(0);
}

let input = {};
try {
  const raw = fs.readFileSync(0, 'utf8').trim();
  input = raw ? JSON.parse(raw) : {};
} catch (_) { process.exit(0); }

const command = (input.tool_input && input.tool_input.command) || '';
const hit = check(command);
if (!hit) process.exit(0);

process.stderr.write(denyMessage(hit, command));
process.exit(2); // exit 2 = block tool call, surface stderr to the model
