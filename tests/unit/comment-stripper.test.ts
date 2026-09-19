import { describe, it, expect } from 'vitest';
import {
  stripJsTsComments,
  stripCssComments,
  stripAstroComments,
  stripMdxComments,
  stripPythonComments,
  stripYamlComments,
  stripContentByExtension,
} from '../../scripts/lib/comment-stripper.mjs';

describe('Comment Stripper (Unit Tests)', () => {
  it('should strip JS/TS single-line and multi-line comments safely without corrupting literals', () => {
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
    expect(result).not.toContain('single line comment');
    expect(result).not.toContain('url inline comment');
    expect(result).not.toContain('multi\n       line');
    expect(result).not.toContain('expr comment');
    expect(result).not.toContain('nested */');
    expect(result).toContain('https://github.com/foo/bar');
    expect(result).toContain('/* this is string */ and // still string');
    expect(result).toContain('10 / 2 / 5');
    expect(result).toContain('/\\/\\//g');
  });

  it('should strip CSS block comments without corrupting quoted strings', () => {
    const input = `
    /* Top level CSS comment */
    .box {
      color: red; /* inline comment */
      content: "/* quote with comment */";
    }
    `;
    const result = stripCssComments(input);
    expect(result).not.toContain('Top level CSS comment');
    expect(result).not.toContain('inline comment');
    expect(result).toContain('content: "/* quote with comment */"');
    expect(result).toContain('color: red;');
  });

  it('should strip Astro comments (frontmatter and HTML comments)', () => {
    const input = `---
// frontmatter comment
import Foo from './Foo.astro';
/* block comment in frontmatter */
---
<!-- HTML comment in template -->
<div class="card">
  {/* JSX comment in template */}
  <Foo />
</div>`;
    const result = stripAstroComments(input);
    expect(result).not.toContain('frontmatter comment');
    expect(result).not.toContain('block comment in frontmatter');
    expect(result).not.toContain('HTML comment in template');
    expect(result).not.toContain('JSX comment in template');
    expect(result).toContain("import Foo from './Foo.astro';");
    expect(result).toContain('<div class="card">');
  });

  it('should strip MDX comments without corrupting math and textbook code blocks', () => {
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
    expect(result).not.toContain('YAML comment in frontmatter');
    expect(result).not.toContain('HTML comment in MDX body');
    expect(result).not.toContain('JSX comment in MDX');
    expect(result).toContain('# This textbook code example comment MUST be preserved!');
    expect(result).toContain('Inline `code with // comments` should stay intact.');
  });

  it('should strip Python and YAML comments', () => {
    const py = `#!/usr/bin/env python3
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
    const strippedPy = stripPythonComments(py);
    expect(strippedPy.startsWith('#!/usr/bin/env python3')).toBe(true);
    expect(strippedPy).not.toContain('Top level Python comment');
    expect(strippedPy).not.toContain('Inside function comment');
    expect(strippedPy).not.toContain('Return comment');
    expect(strippedPy).toContain('https://example.com/#anchor');
    expect(strippedPy).toContain('Triple quote string with # hash inside');

    const yaml = `
# Global YAML config comment
name: "AstroLib" # Inline comment
repo: "https://github.com/foo/bar#anchor"
nested:
  # Nested comment
  enabled: true
`;
    const strippedYaml = stripYamlComments(yaml);
    expect(strippedYaml).not.toContain('Global YAML config comment');
    expect(strippedYaml).not.toContain('Inline comment');
    expect(strippedYaml).not.toContain('Nested comment');
    expect(strippedYaml).toContain('name: "AstroLib"');
    expect(strippedYaml).toContain('repo: "https://github.com/foo/bar#anchor"');
  });

  it('should dispatch by file extension correctly', () => {
    expect(stripContentByExtension('// comment\nconst a = 1;', '.js')).toBe('const a = 1;\n');
    expect(stripContentByExtension('/* comment */ body { margin: 0; }', '.css')).toBe('body { margin: 0; }\n');
  });
});
