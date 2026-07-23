#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [sourceRoot, repairedRoot] = process.argv.slice(2);
if (!sourceRoot || !repairedRoot) {
  console.error('Usage: node find-corrupted-operators.mjs <known-good-root> <candidate-root>');
  process.exit(2);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let matches = 0;
for (const candidateFile of walk(repairedRoot).filter((file) => file.endsWith('.html'))) {
  const relative = path.relative(repairedRoot, candidateFile);
  const sourceFile = path.join(sourceRoot, relative);
  if (!fs.existsSync(sourceFile)) continue;

  const before = fs.readFileSync(sourceFile, 'utf8').split(/\r?\n/);
  const after = fs.readFileSync(candidateFile, 'utf8').split(/\r?\n/);
  const limit = Math.min(before.length, after.length);

  for (let index = 0; index < limit; index += 1) {
    const expectedBroken = before[index].replaceAll(' - ', ', ');
    if (before[index] !== expectedBroken && after[index] === expectedBroken) {
      console.log(`${relative}:${index + 1}`);
      console.log(`  good: ${before[index].trim()}`);
      console.log(`  bad:  ${after[index].trim()}`);
      matches += 1;
    }
  }
}

console.log(`\n${matches} likely operator replacements found.`);
