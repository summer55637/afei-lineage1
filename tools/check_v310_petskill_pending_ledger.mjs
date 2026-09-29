#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const game = read('game.js');
const readme = read('README.md');
const changelog = read('CHANGELOG.md');
const visualRef = read('docs/reference/video-001-visual-reference.md');

const fail = (message) => {
  console.error(`V3.10 PetSkill pending ledger FAILED: ${message}`);
  process.exit(1);
};

const occurrences = [];
const marker = 'sourceRuntimePending:true';
let cursor = 0;
while (true) {
  const index = game.indexOf(marker, cursor);
  if (index === -1) break;
  occurrences.push(index);
  cursor = index + marker.length;
}

// The V2.86 source-closure audit deliberately left seven defensive
// sourceRuntimePending fences in place. V3.10 keeps that count frozen until
// each fence is promoted only after fixed-C evidence is available.
if (occurrences.length !== 7) {
  fail(`expected exactly 7 ${marker} fences, found ${occurrences.length}`);
}

const functionBefore = (index) => {
  const prefix = game.slice(0, index);
  const matches = [...prefix.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)];
  return matches.length ? matches.at(-1)[1] : null;
};

const pendingFunctions = occurrences.map(functionBefore);
if (pendingFunctions.some((name) => !name)) {
  fail(`could not resolve a function owner for all pending fences: ${pendingFunctions.join(', ')}`);
}

const requiredOwners = [
  'sourcePerformPetStatusSkill',
  'sourcePerformPetRefreshSkill',
  'sourcePerformPetSpecialStatusSkill',
  'sourcePerformPetMagicStatusChangeSkill',
  'sourcePerformPetBattlePropertySkill',
  'sourcePerformPetCombinedSkill',
];

for (const owner of requiredOwners) {
  if (!pendingFunctions.includes(owner)) {
    fail(`missing expected pending owner: ${owner}`);
  }
}

// The seventh fence is intentionally the dispatcher-level fail-closed path;
// keep it owned by a source/runtime function rather than a UI/helper function.
const seventhOwners = pendingFunctions.filter((name) => !requiredOwners.includes(name));
if (seventhOwners.length !== 1 || !/^source(?:Perform)?Pet/.test(seventhOwners[0])) {
  fail(`expected one dispatcher-level PetSkill fence, found: ${seventhOwners.join(', ')}`);
}

const section = (functionName) => {
  const start = game.indexOf(`function ${functionName}(`);
  if (start === -1) fail(`function not found: ${functionName}`);
  const next = game.indexOf('\nfunction ', start + 1);
  return game.slice(start, next === -1 ? game.length : next);
};

const magicStatusSection = section('sourcePerformPetMagicStatusChangeSkill');
if (!magicStatusSection.includes('鐵壁') || !magicStatusSection.includes(marker)) {
  fail('MagicStatusChange pending fence no longer has the fixed, explicit 鐵壁 boundary');
}

const combinedSection = section('sourcePerformPetCombinedSkill');
for (const token of ['SOURCE_COMBINED_MISSING_MAGIC_IDS', 'sourceBattleHandleEnemyDeathCredit', marker]) {
  if (!combinedSection.includes(token)) {
    fail(`Combined path lost required source-backed guard/token: ${token}`);
  }
}

const fixedCPin = 'gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
if (!readme.includes(fixedCPin) || !changelog.includes(fixedCPin)) {
  fail(`fixed-C pin is no longer present in README/CHANGELOG: ${fixedCPin}`);
}

if (!/^# .*V3\.09/m.test(changelog)) {
  fail('CHANGELOG no longer declares V3.09 as the current playable baseline');
}

if (!visualRef.includes('戰鬥') || !visualRef.includes('HUD') || !visualRef.includes('視覺')) {
  fail('visual reference lost its battle/HUD visual guidance markers');
}

console.log('V3.10 PetSkill pending ledger: PASS');
console.log(`Pending fences: ${occurrences.length}`);
console.log(`Owners: ${pendingFunctions.join(', ')}`);
console.log(`Fixed C pin: ${fixedCPin}`);
console.log('No PetSkill pending fence was promoted or behavior guessed by this check.');
