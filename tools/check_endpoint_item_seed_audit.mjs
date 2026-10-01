#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SETUP = path.join(ROOT, 'ro0000/server/merged-source/gmsv/setup.cf');
const CSV = path.join(ROOT, 'ro0000/server/merged-source/gmsv/data/itemset6.csv');
const OUT = path.join(ROOT, 'data/generated/stoneage_endpoint_item_seed_audit.json');

function fail(message) { throw new Error(message); }

function gitSha(relPath) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD:' + relPath], {
      cwd: ROOT, encoding: 'utf8'
    }).trim();
  } catch {
    return 'unknown';
  }
}

function parseSetup(text) {
  const values = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (/^[A-Za-z0-9_]+$/.test(key) && !values.has(key)) values.set(key, value);
  }
  return values;
}

function exactTokenPositions(line, wanted) {
  return line.split(',').flatMap((token, index) =>
    token.trim() === String(wanted) ? [index + 1] : []
  );
}

function buildAudit() {
  if (!fs.existsSync(SETUP)) fail('Missing endpoint setup.cf');
  if (!fs.existsSync(CSV)) fail('Missing endpoint gmsv/data/itemset6.csv');

  const setup = parseSetup(fs.readFileSync(SETUP, 'latin1'));
  const configuredItem1 = Number(setup.get('ITEM1'));
  const configuredItemsetFile = setup.get('itemset6file');

  if (!Number.isInteger(configuredItem1) || configuredItem1 <= 0) {
    fail('Endpoint ITEM1 is missing or invalid.');
  }
  if (configuredItemsetFile !== 'data/itemset6.csv') {
    fail('Endpoint setup.cf does not select data/itemset6.csv; got ' + configuredItemsetFile);
  }

  const raw = fs.readFileSync(CSV);
  const lines = raw.toString('latin1').split(/\r?\n/).filter(line => line.length > 0);
  const rowWidthCounts = new Map();
  const exact = new Map([[32003, []], [24114, []]]);

  for (let rowIndex = 0; rowIndex < lines.length; rowIndex++) {
    const tokens = lines[rowIndex].split(',');
    rowWidthCounts.set(tokens.length, (rowWidthCounts.get(tokens.length) ?? 0) + 1);
    for (const wanted of [32003, 24114]) {
      const positions = exactTokenPositions(lines[rowIndex], wanted);
      if (positions.length) exact.get(wanted).push({ line: rowIndex + 1, positions });
    }
  }

  const sortedWidths = [...rowWidthCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([columns, rows]) => ({ columns: Number(columns), rows }));

  const safeItemSlots = {};
  for (let i = 1; i <= 15; i++) {
    const key = 'ITEM' + i;
    if (setup.has(key)) safeItemSlots[key] = setup.get(key);
  }

  const configured32003 = exact.get(32003);
  const fixed24114 = exact.get(24114);

  return {
    format: 'stoneage-endpoint-item-seed-audit-v1',
    status: configured32003.length > 0 ? 'endpoint-seed-candidate-found' : 'unresolved',
    source: {
      setupPath: 'ro0000/server/merged-source/gmsv/setup.cf',
      setupBlobSha: gitSha('ro0000/server/merged-source/gmsv/setup.cf'),
      itemConfig: 'ITEM1=' + configuredItem1,
      itemset6file: configuredItemsetFile,
      itemset6Path: 'ro0000/server/merged-source/gmsv/data/itemset6.csv',
      itemset6BlobSha: gitSha('ro0000/server/merged-source/gmsv/data/itemset6.csv'),
      itemset6Bytes: raw.length,
      itemset6Lines: lines.length
    },
    endpointConfig: {
      item1: configuredItem1,
      itemSlots: safeItemSlots
    },
    csvShape: {
      distinctColumnCounts: sortedWidths,
      dominantColumnCount: sortedWidths[0]?.columns ?? null
    },
    exactTokenMatches: {
      configuredItem1_32003: configured32003,
      fixedConfiguredItem_24114: fixed24114
    },
    keyFindings: {
      configuredItem1PresentAsExactToken: configured32003.length > 0,
      fixedConfigured24114PresentAsExactToken: fixed24114.length > 0,
      fixedConfigured24114Occurrences: fixed24114.map(match => ({
        line: match.line,
        positions: match.positions
      })),
      endpointSemanticsClosed: false
    },
    resolution: configured32003.length > 0
      ? {
          status: 'candidate',
          rule: '32003 exists in selected endpoint itemset6.csv; continue loader/field-semantic audit before canonicalization.'
        }
      : {
          status: 'unresolved',
          reason: 'setup.cf explicitly configures ITEM1=32003, but selected endpoint itemset6.csv contains no exact numeric token 32003. Do not remap or substitute another item from this evidence alone.',
          secondaryEvidence: fixed24114.length > 0
            ? 'The same endpoint itemset6.csv contains exactly one 24114 token occurrence, so the endpoint data is not simply missing the value 24114.'
            : 'The selected endpoint Item table contains neither configured 32003 nor 24114 as an exact numeric token.'
        },
    interpretation: {
      fixedCFixedItemRuleApplied: false,
      note: 'Endpoint evidence only. This audit intentionally does not assume pinned fixed-C ITEM_ID_TOKEN_INDEX or ID-remap semantics.'
    }
  };
}

const result = buildAudit();
const serialized = JSON.stringify(result, null, 2) + '\n';

if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) fail('Missing generated audit: ' + OUT);
  const current = fs.readFileSync(OUT, 'utf8');
  if (current !== serialized) {
    fail('Endpoint Item seed audit is stale. Run node tools/check_endpoint_item_seed_audit.mjs --write and commit the generated JSON.');
  }
  process.stdout.write('endpoint-item-seed-audit-check-ok\n');
} else if (process.argv.includes('--write')) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialized);
  process.stdout.write(serialized);
} else {
  process.stdout.write(serialized);
}
