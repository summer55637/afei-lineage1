#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sourceRel = 'ro0000/server/merged-source/gmsv/data/map/battlemap.txt';
const outRel = 'data/generated/stoneage_ro0000_battlemap_selector_audit.json';
const source = path.join(ROOT, sourceRel);
if (!fs.existsSync(source)) throw new Error('Missing ' + sourceRel);

const lines = fs.readFileSync(source, 'utf8').split(/\r?\n/);
const blocks = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  const s = raw.trim();
  if (!s || s.startsWith('#')) continue;

  if (s.startsWith('$')) {
    const spec = (s.slice(1).match(/-?\d+/g) ?? []).map(Number);
    if (!spec.length) continue;
    current = { blockLine: i + 1, spec, ranges: [] };
    blocks.push(current);
    continue;
  }

  if (!current) continue;
  const m = s.match(/^(\d+)(?:\s+to\s+(\d+))?$/);
  if (!m) continue;
  const first = Number(m[1]);
  const last = Number(m[2] ?? m[1]);
  current.ranges.push({ line: i + 1, first, last, valid: first <= last });
}

const ref = new Map();
const reversedRanges = [];
let assignedImageNumbers = 0;
let duplicateImageAssignments = 0;

for (const block of blocks) {
  const effective = [
    block.spec[0] ?? 0,
    block.spec[1] ?? block.spec[0] ?? 0,
    block.spec[2] ?? block.spec[0] ?? 0
  ];
  block.effective = effective;

  for (const range of block.ranges) {
    if (!range.valid) {
      reversedRanges.push({
        blockLine: block.blockLine,
        rangeLine: range.line,
        first: range.first,
        last: range.last,
        raw: lines[range.line - 1].trim()
      });
      continue;
    }

    for (let imageNo = range.first; imageNo <= range.last; imageNo++) {
      assignedImageNumbers++;
      if (ref.has(imageNo)) duplicateImageAssignments++;
      ref.set(imageNo, { blockLine: block.blockLine, effective });
    }
  }
}

const referencedBattleMapNos = [...new Set(blocks.flatMap(b => b.effective))].sort((a, b) => a - b);
const unusedBattleMapNos = Array.from({ length: 220 }, (_, i) => i)
  .filter(i => !referencedBattleMapNos.includes(i));

const output = {
  format: 'ro0000-battlemap-selector-audit-v1',
  source: sourceRel,
  fixedCParser: 'gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56 MAP_readBattleMapConfFile',
  fixedCBattleSelector: 'gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56 BATTLE_getBattleFieldNo',
  summary: {
    activeBlocks: blocks.length,
    oneSlotBlocks: blocks.filter(b => b.spec.length === 1).length,
    twoSlotBlocks: blocks.filter(b => b.spec.length === 2).length,
    threeSlotBlocks: blocks.filter(b => b.spec.length === 3).length,
    distinctBattleMapNos: referencedBattleMapNos.length,
    unusedBattleMapNos,
    assignedImageNumbers,
    duplicateImageAssignments,
    reversedRanges
  },
  semantics: {
    header: '$ a [b] [c]',
    omittedCandidates: 'initialize all three candidates to a, then overwrite supplied b/c',
    selection: 'map[RAND(0,2)]',
    duplicateAssignment: 'duplicate is logged but later MAP_setImageInt writes the later mapping'
  },
  selectedRanges: blocks.map(({ blockLine, spec, effective, ranges }) => ({
    blockLine, spec, effective, ranges
  }))
};

fs.mkdirSync(path.dirname(path.join(ROOT, outRel)), { recursive: true });
fs.writeFileSync(path.join(ROOT, outRel), JSON.stringify(output, null, 2) + '\n');
console.log('Wrote ' + outRel);
