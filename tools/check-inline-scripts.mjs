#!/usr/bin/env node
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = resolve(process.argv[2] || '.');
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (name.endsWith('.html')) files.push(path);
  }
}

walk(root);
const temp = mkdtempSync(join(tmpdir(), 'cgm-inline-check-'));
let failures = 0;
let checked = 0;

try {
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
    let index = 0;
    for (const match of scripts) {
      index += 1;
      const attrs = match[1] || '';
      const code = match[2] || '';
      if (/\bsrc\s*=|application\/ld\+json/i.test(attrs) || !code.trim()) continue;
      checked += 1;
      const tempFile = join(temp, `${checked}.js`);
      writeFileSync(tempFile, code);
      const result = spawnSync(process.execPath, ['--check', tempFile], { encoding: 'utf8' });
      if (result.status !== 0) {
        failures += 1;
        console.error(`FAIL ${file.slice(root.length + 1)} inline script ${index}`);
        const output = (result.stderr || result.stdout).trim();
        console.error(output);
        const lineMatch = output.match(/:(\d+)\n/);
        if (lineMatch) {
          const line = Number(lineMatch[1]);
          const lines = code.split(/\r?\n/);
          const start = Math.max(0, line - 4);
          const end = Math.min(lines.length, line + 3);
          console.error(lines.slice(start, end).map((value, offset) => `${String(start + offset + 1).padStart(5)} | ${value}`).join('\n'));
        }
      }
    }
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log(`Checked ${checked} inline JavaScript blocks across ${files.length} HTML files.`);
if (failures) {
  console.error(`Inline JavaScript failures: ${failures}`);
  process.exit(1);
}
console.log('Inline JavaScript failures: 0');
