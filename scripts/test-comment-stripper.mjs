import assert from 'node:assert';
import {
  stripJsTsComments,
  stripCssComments,
  stripAstroComments,
  stripMdxComments,
  stripPythonComments,
  stripYamlComments,
  stripContentByExtension,
} from './lib/comment-stripper.mjs';

console.log('--- Running Comment Stripper Unit Tests ---');

// 1. JS / TS Tests
{
  const input = `
  // single line comment
  const url = "https://github.com/foo/bar"; // url inline comment
  /* multi
     line
     comment */
  const strWithCommentChars = '/* this is string */ and // still string';
  const template = \`hello \${/* expr comment */ 1 + 2} \${ \`nested \${/* nested */ 4}\` }\`;
  const regex = /\\/\\//g; // regex test
  const div = 10 / 2 / 5;
  `;

  const result = stripJsTsComments(input);
  assert(!result.includes('single line comment'), 'Should strip single line comment');
  assert(!result.includes('url inline comment'), 'Should strip url inline comment');
  assert(!result.includes('multi\n     line'), 'Should strip multi-line comment');
  assert(!result.includes('expr comment'), 'Should strip template expr comment');
  assert(!result.includes('nested */'), 'Should strip nested template comment');
  assert(result.includes('https://github.com/foo/bar'), 'Should preserve URL string');
  assert(result.includes('/* this is string */ and // still string'), 'Should preserve comment chars inside string');
  assert(result.includes('10 / 2 / 5'), 'Should preserve division operators');
  assert(result.includes('/\\/\\//g'), 'Should preserve regex literal');
  console.log('✓ JS / TS tests passed');
}

// 2. CSS Tests
{
  const input = `
  /* Top level CSS comment */
  .box {
    color: red; /* inline comment */
    content: "/* quote with comment */";
  }
  `;
  const result = stripCssComments(input);
  assert(!result.includes('Top level CSS comment'), 'Should strip CSS block comment');
  assert(!result.includes('inline comment'), 'Should strip CSS inline comment');
  assert(result.includes('content: "/* quote with comment */"'), 'Should preserve quote in CSS');
  assert(result.includes('color: red;'), 'Should preserve CSS rule');
  console.log('✓ CSS tests passed');
}

// 3. Astro Tests
{
  const input = `---
// Frontmatter comment
import Header from '../components/Header.astro';
/* FM block comment */
const title = "My Site";
---
<!-- HTML template comment -->
<div class="container">
  {/* JSX template comment */}
  <h1>{title}</h1>
</div>
<style>
  /* Style comment */
  h1 { font-size: 2rem; }
</style>
<script>
  // Client script comment
  console.log("ready");
</script>
`;
  const result = stripAstroComments(input);
  assert(!result.includes('Frontmatter comment'), 'Should strip FM comment');
  assert(!result.includes('FM block comment'), 'Should strip FM block comment');
  assert(!result.includes('HTML template comment'), 'Should strip HTML comment');
  assert(!result.includes('JSX template comment'), 'Should strip JSX comment');
  assert(!result.includes('Style comment'), 'Should strip style comment');
  assert(!result.includes('Client script comment'), 'Should strip script comment');
  assert(result.includes('import Header from'), 'Should preserve FM import');
  assert(result.includes('<h1>{title}</h1>'), 'Should preserve template elements');
  assert(result.includes('font-size: 2rem;'), 'Should preserve style rules');
  console.log('✓ Astro tests passed');
}

// 4. MDX Tests
{
  const input = `---
title: "Sample MDX"
# YAML comment in frontmatter
description: "Description"
---
<!-- HTML comment in MDX body -->
{/* JSX comment in MDX */}

# Introduction

Here is some textbook content.

\`\`\`python
# This textbook code example comment MUST be preserved!
def example():
    return 42
\`\`\`

Inline \`code with // comments\` should stay intact.
`;
  const result = stripMdxComments(input);
  assert(!result.includes('YAML comment in frontmatter'), 'Should strip YAML comment in FM');
  assert(!result.includes('HTML comment in MDX body'), 'Should strip HTML comment in MDX');
  assert(!result.includes('JSX comment in MDX'), 'Should strip JSX comment in MDX');
  assert(result.includes('# This textbook code example comment MUST be preserved!'), 'Should preserve code block comments');
  assert(result.includes('Inline `code with // comments` should stay intact.'), 'Should preserve inline code comments');
  console.log('✓ MDX tests passed');
}

// 5. Python Tests
{
  const input = `#!/usr/bin/env python3
# Top level Python comment
import sys

def foo():
    # Inside function comment
    url = "https://example.com/#anchor"
    doc = """
    Triple quote string with # hash inside
    """
    return url # Return comment
`;
  const result = stripPythonComments(input);
  assert(result.startsWith('#!/usr/bin/env python3'), 'Should preserve shebang');
  assert(!result.includes('Top level Python comment'), 'Should strip top level comment');
  assert(!result.includes('Inside function comment'), 'Should strip function comment');
  assert(!result.includes('Return comment'), 'Should strip return comment');
  assert(result.includes('https://example.com/#anchor'), 'Should preserve string with #');
  assert(result.includes('Triple quote string with # hash inside'), 'Should preserve triple-quoted string');
  console.log('✓ Python tests passed');
}

// 6. YAML Tests
{
  const input = `
# Global YAML config comment
name: "AstroLib" # Inline comment
repo: "https://github.com/foo/bar#anchor"
nested:
  # Nested comment
  enabled: true
`;
  const result = stripYamlComments(input);
  assert(!result.includes('Global YAML config comment'), 'Should strip YAML top level comment');
  assert(!result.includes('Inline comment'), 'Should strip YAML inline comment');
  assert(!result.includes('Nested comment'), 'Should strip YAML nested comment');
  assert(result.includes('name: "AstroLib"'), 'Should preserve config value');
  assert(result.includes('repo: "https://github.com/foo/bar#anchor"'), 'Should preserve URL string with #');
  console.log('✓ YAML tests passed');
}

// 7. Dispatcher Test
{
  assert.strictEqual(stripContentByExtension('// comment\nconst a = 1;', '.js'), 'const a = 1;\n');
  assert.strictEqual(stripContentByExtension('/* comment */ body { margin: 0; }', '.css'), 'body { margin: 0; }\n');
  console.log('✓ Dispatcher tests passed');
}

console.log('\n🎉 ALL COMMENT STRIPPER UNIT TESTS PASSED SUCCESSFULLY! 🎉\n');
