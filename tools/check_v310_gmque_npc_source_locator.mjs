#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ledgerPath = path.join(root, 'data/generated/stoneage_gmque_source_closure.json');
const readmePath = path.join(root, 'README.md');
const changelogPath = path.join(root, 'CHANGELOG.md');
const docPath = path.join(root, 'docs/reference/gmque-npc-source-contract.md');

const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const read = file => fs.readFileSync(file, 'utf8');
const fail = message => {
  console.error(`V3.10 GMQUE NPC source locator FAILED: ${message}`);
  process.exit(1);
};

const fixed = ledger.fixedC ?? {};
if (fixed.repository !== 'gavinlinasd/StoneAge') fail('fixed repository drifted');
if (fixed.ref !== '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56') fail('fixed C pin drifted');
if (fixed.path !== 'gmsv/src/npc/npc_eventaction.c') fail('fixed source path drifted');

const contract = ledger.queue?.npcArgContract ?? {};
if (contract.parser !== 'sourceGmQueParseNpcArg') fail('NPC parser contract missing');
if (contract.requiredCount !== 4) fail(`expected four queue slots, got ${contract.requiredCount}`);
if (contract.liveNpcDataPresent !== false) fail('liveNpcDataPresent must remain false until evidence is actually imported');

// These are evidence locations used by common StoneAge 8.0 layouts. The locator never
// treats the current generated adapter files as live NPC data.
const candidateRoots = [
  // Complete VM one-click deployment corpus.
  'ro0000/server/merged-source/gmsv/data/npc',
  // Historical / alternate layouts.
  'data/npc',
  'gmsv/data/npc',
  'source/data/npc',
  'vendor/data/npc',
  'references/data/npc',
  'reference/data/npc'
];

const files = [];
const walk = dir => {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) files.push(full);
  }
};
for (const rel of candidateRoots) walk(path.join(root, rel));

const matches = [];
for (const file of files) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); }
  catch { continue; }
  if (!/[\s|:]RANDGMQUE\s*=|RANDGMQUE/.test(text)) continue;
  if (!/(QUEPART0|QUEPART1|QUEPART2|QUEPART3)/.test(text)) continue;
  matches.push({
    path: path.relative(root, file).replaceAll(path.sep, '/'),
    bytes: fs.statSync(file).size
  });
}

// Current source tree must stay fail-closed. Merely having an NPC-looking file does not
// promote it: the imported source must be explicitly pinned and then admitted by a later
// closure patch. This check only reports candidates for that next step.
const expectedStatus = matches.length ? 'candidate-found' : 'pending-source';
if (ledger.unresolved?.some(x => x.key === 'gmqueNpcArguments') && ledger.unresolved.find(x => x.key === 'gmqueNpcArguments').status !== expectedStatus) {
  fail(`ledger gmqueNpcArguments status must be ${expectedStatus}`);
}

const readme = read(readmePath);
const changelog = read(changelogPath);
const doc = read(docPath);
for (const [name, text] of [['README.md', readme], ['CHANGELOG.md', changelog], [docPath, doc]]) {
  if (!text.includes('gmsv/data/npc')) fail(`${name} is missing the canonical NPC data search path`);
}
if (matches.length === 0 && !doc.includes('沒有找到真實 NPC argument')) {
  fail('documentation no longer states the source gap');
}

console.log(JSON.stringify({
  pass: true,
  version: 'V3.10-groundwork',
  focus: 'GMQUE NPC source locator',
  candidateCount: matches.length,
  candidates: matches,
  liveNpcDataPresent: false,
  playableCore: ledger.playableCore
}));
