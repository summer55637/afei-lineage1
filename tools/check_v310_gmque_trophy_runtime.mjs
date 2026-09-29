#!/usr/bin/env node
'use strict';

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const gamePath = path.join(root, 'game.js');
if (!fs.existsSync(gamePath)) throw new Error(`game.js not found under ${root}`);
const source = fs.readFileSync(gamePath, 'utf8');

const FIXED_C_REF = '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
if (!source.includes(FIXED_C_REF)) {
  throw new Error(`game.js does not contain pinned fixed-C ref ${FIXED_C_REF}`);
}

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`missing ${name}`);
  const brace = source.indexOf('{', start);
  if (brace < 0) throw new Error(`missing body for ${name}`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = brace; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

function requirePattern(text, pattern, label) {
  if (!pattern.test(text)) throw new Error(`${label}: missing ${pattern}`);
}

const action = extractFunction('sourceGmQueActionValue');
const rewardType = extractFunction('sourceGmQueRewardType');
const resolve = extractFunction('sourceGmQueResolveTrophy');

// GMQUE_CheckQueStr: fixed source uses rand()%100 and normalizes zero to 1.
requirePattern(action, /randModulo\(100\)/, 'action roll modulus');
requirePattern(action, /raw\s*===\s*0\s*\?\s*1\s*:\s*raw/, 'zero-to-one normalization');

// GMQUE reward type boundaries: >97 pet, >40 item, otherwise gold.
requirePattern(rewardType, /gmqueNums\s*>\s*97/, 'pet threshold');
requirePattern(rewardType, /gmqueNums\s*>\s*40/, 'item threshold');
requirePattern(rewardType, /['"]pet['"]/, 'pet reward type');
requirePattern(rewardType, /['"]item['"]/, 'item reward type');
requirePattern(rewardType, /['"]gold['"]/, 'gold reward type');

// Pet branch: inclusive 0..3 selection and explicit implicit-zero fail-closed path.
requirePattern(resolve, /petReward/, 'pet reward table');
requirePattern(resolve, /effectiveIds/, 'effective pet id list');
requirePattern(resolve, /randInclusive\(0\s*,\s*3\)/, 'pet inclusive index');
requirePattern(resolve, /implicit-zero-pet-slot/, 'pet zero-slot guard');

// Item branch: five fixed pools selected by the documented primary thresholds.
requirePattern(resolve, /randInclusive\(0\s*,\s*100\)/, 'item primary inclusive roll');
for (const pool of [3, 2, 4, 5, 1]) {
  requirePattern(resolve, new RegExp(`itemID${pool}`), `itemID${pool} pool`);
}
for (const threshold of [97, 70, 40]) {
  requirePattern(resolve, new RegExp(`>=\\s*${threshold}`), `item threshold ${threshold}`);
}

// Gold branch: fixed 0..30 primary roll, then the two documented direct branches
// and the secondary 2..4 table lookup for the low-roll branch.
requirePattern(resolve, /randInclusive\(0\s*,\s*30\)/, 'gold primary inclusive roll');
requirePattern(resolve, /20000/, 'gold 20k branch');
requirePattern(resolve, /50000/, 'gold 50k branch');
requirePattern(resolve, /randInclusive\(2\s*,\s*4\)/, 'gold secondary inclusive roll');
requirePattern(resolve, /goldByIndex/, 'gold secondary lookup');

// All source-backed resolver failures remain fail-closed; this prevents a missing
// generated runtime table from becoming an invented player reward.
requirePattern(resolve, /runtime-missing/, 'runtime-missing fail-closed');
requirePattern(resolve, /missing-item-pool/, 'missing item-pool fail-closed');

console.log('V3.10 GMQUE trophy runtime regression PASS');
