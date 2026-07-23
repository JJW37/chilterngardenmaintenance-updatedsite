#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [sourceRoot, targetRoot] = process.argv.slice(2);
if (!sourceRoot || !targetRoot) {
  console.error('Usage: node restore-inline-script-operators.mjs <known-good-root> <target-root>');
  process.exit(2);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function inlineBlocks(html) {
  const blocks = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    if (/\bsrc\s*=/i.test(match[1]) || /application\/ld\+json/i.test(match[1])) continue;
    blocks.push({ start: match.index, end: pattern.lastIndex, open: match[1], code: match[2] });
  }
  return blocks;
}

let filesChanged = 0;
let linesRestored = 0;

for (const targetFile of walk(targetRoot).filter((file) => file.endsWith('.html'))) {
  const relative = path.relative(targetRoot, targetFile);
  const sourceFile = path.join(sourceRoot, relative);
  if (!fs.existsSync(sourceFile)) continue;

  const source = fs.readFileSync(sourceFile, 'utf8');
  const target = fs.readFileSync(targetFile, 'utf8');
  const sourceBlocks = inlineBlocks(source);
  const targetBlocks = inlineBlocks(target);
  if (!sourceBlocks.length || !targetBlocks.length) continue;

  const replacements = new Map();
  sourceBlocks.forEach((block) => {
    block.code.split(/\r?\n/).forEach((line) => {
      const corrupted = line.replaceAll(' - ', ', ');
      if (corrupted !== line) {
        const existing = replacements.get(corrupted);
        if (existing === undefined) replacements.set(corrupted, line);
        else if (existing !== line) replacements.set(corrupted, null);
      }
    });
  });

  if (!replacements.size) continue;
  let fileRestored = 0;
  const rebuilt = [];
  let cursor = 0;
  for (const block of targetBlocks) {
    rebuilt.push(target.slice(cursor, block.start));
    const restoredCode = block.code.split(/(\r?\n)/).map((part) => {
      const replacement = replacements.get(part);
      if (replacement && replacement !== part) {
        fileRestored += 1;
        return replacement;
      }
      return part;
    }).join('');
    rebuilt.push(`<script${block.open}>${restoredCode}</script>`);
    cursor = block.end;
  }
  rebuilt.push(target.slice(cursor));

  if (fileRestored) {
    fs.writeFileSync(targetFile, rebuilt.join(''));
    filesChanged += 1;
    linesRestored += fileRestored;
    console.log(`${relative}: restored ${fileRestored} inline-script line(s)`);
  }
}

console.log(`Restored ${linesRestored} inline-script line(s) across ${filesChanged} file(s).`);
