#!/usr/bin/env node
import fs from 'node:fs';

const commitMsgFile = process.argv[2];

if (!commitMsgFile || !fs.existsSync(commitMsgFile)) {
  console.error('[commit-msg hook] Error: Commit message file not found.');
  process.exit(1);
}

const rawMsg = fs.readFileSync(commitMsgFile, 'utf8');

// Filter out git comment lines (starting with #)
const lines = rawMsg.split(/\r?\n/).filter(line => !line.trim().startsWith('#'));
const firstLine = (lines[0] || '').trim();

if (!firstLine) {
  console.error('\n❌ [Commit Rejected] Commit message cannot be empty.\n');
  process.exit(1);
}

// Special case: Merge commits or auto-generated squash commits
if (/^Merge branch /i.test(firstLine) || /^Merge remote-tracking branch /i.test(firstLine) || /^Revert /i.test(firstLine)) {
  process.exit(0);
}

// Conventional Commits Pattern (Academic & Restrained English):
// e.g. feat(ai): integrate contextual document retrieval
// e.g. fix(katex): prevent formula text overlap on narrow viewports
// e.g. chore: upgrade astro and starlight dependencies
const conventionalPattern = /^(feat|fix|perf|refactor|docs|style|chore|test|release|ci|build)(\([a-z0-9_/-]+\))?:\s+[a-z0-9].+$/;

// Check for non-ASCII characters (disallows Chinese characters, special unicode symbols, emojis)
const nonAsciiPattern = /[^\x00-\x7F]/;

// Check for emoji patterns explicitly
const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

let hasError = false;

if (emojiPattern.test(firstLine)) {
  console.error('\n❌ [Commit Rejected] Emojis are strictly prohibited in commit messages.');
  console.error('   Please use restrained, academic-style English text without emojis.\n');
  hasError = true;
}

if (nonAsciiPattern.test(firstLine)) {
  console.error('\n❌ [Commit Rejected] Commit summary must be written in English only (ASCII characters).');
  console.error(`   Received: "${firstLine}"`);
  console.error('   Please translate commit descriptions to concise academic English.\n');
  hasError = true;
}

if (!conventionalPattern.test(firstLine)) {
  console.error('\n❌ [Commit Rejected] Commit message must follow the Conventional Academic specification:');
  console.error('   Format: <type>(<scope>): <summary in imperative English>');
  console.error('   Allowed Types: feat, fix, perf, refactor, docs, style, chore, test, release, ci, build');
  console.error('   Valid Examples:');
  console.error('     feat(content): import linear algebra textbook and solution keys');
  console.error('     fix(layout): resolve equation overflow on mobile viewport');
  console.error('     perf(render): pre-render heading formulas during build');
  console.error('     chore(ci): configure automated EPUB release pipeline');
  console.error(`   Received: "${firstLine}"\n`);
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

process.exit(0);
