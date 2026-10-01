#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SETUP = path.join(ROOT, 'ro0000/server/merged-source/gmsv/setup.cf');
const CSV = path.join(ROOT, 'ro0000/server/merged-source/gmsv/data/itemset6.csv');

function fail(message) { throw new Error(message); }

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
  return line.split(',').flatMap((token, index) => token.trim() === String(wanted) ? [index + 1] : []);
}

if (!fs.existsSync(SETUP)) fail('Missing endpoint setup.cf');
if (!fs.existsSync(CSV)) fail('Missing endpoint gmsv/data/itemset6.csv');

const setup = parseSetup(fs.readFileSync(SETUP, 'latin1'));
const configuredItem1 = Number(setup.get('ITEM1'));
const configuredItemsetFile = setup.get('itemset6file');
if (!Number.isInteger(configuredItem1) || configuredItem1 <= 0) fail('Endpoint ITEM1 is missing or invalid.');
if (configuredItemsetFile !== 'data/itemset6.csv') fail('Endpoint setup.cf does not select data/itemset6.csv; got ' + configuredItemsetFile);

const raw = fs.readFileSync(CSV);
const text = raw.toString('latin1');
const lines = text.split(/\r?\n/).filter(line => line.length > 0);
const rowWidthCounts = new Map();
const exact = new Map([[32003, []], [24114, []]]);
const firstField = new Map([[32003, []], [24114, []]]);
const seventeenthField = new Map([[32003, []], [24114, []]]);

for (let rowIndex = 0; rowIndex < lines.length; rowIndex++) {
  const tokens = lines[rowIndex].split(',');
  rowWidthCounts.set(tokens.length, (rowWidthCounts.get(tokens.length) ?? 0) + 1);
  for (const wanted of [32003, 24114]) {
    const positions = exactTokenPositions(lines[rowIndex], wanted);
    if (positions.length) exact.get(wanted).push({ line: rowIndex + 1, positions });
    if (tokens[0]?.trim() === String(wanted)) firstField.get(wanted).push(rowIndex + 1);
    if (tokens[16]?.trim() === String(wanted)) seventeenthField.get(wanted).push(rowIndex + 1);
  }
}

const matchingRowPreviews = {};
for (const wanted of [32003, 24114]) {
  matchingRowPreviews[wanted] = exact.get(wanted).slice(0, 10).map(match => ({
    line: match.line,
    positions: match.positions,
    tokens: lines[match.line - 1].split(',').slice(0, 25)
  }));
}

const sortedWidths = [...rowWidthCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0] - b[0])
  .map(([columns, rows]) => ({ columns: Number(columns), rows }));

const safeItemSlots = {};
for (let i = 1; i <= 15; i++) {
  const key = 'ITEM' + i;
  if (setup.has(key)) safeItemSlots[key] = setup.get(key);
}

const result = {
  format: 'stoneage-endpoint-item-seed-audit-v1',
  source: {
    setupPath: 'ro0000/server/merged-source/gmsv/setup.cf',
    setupBlobSha: process.env.ENDPOINT_SETUP_BLOB_SHA ?? 'unknown',
    itemConfig: 'ITEM1=' + configuredItem1,
    itemset6file: configuredItemsetFile,
    itemset6Path: 'ro0000/server/merged-source/gmsv/data/itemset6.csv',
    itemset6BlobSha: process.env.ENDPOINT_ITEMSET6_BLOB_SHA ?? 'unknown',
    itemset6Bytes: raw.length,
    itemset6Lines: lines.length
  },
  endpointConfig: { item1: configuredItem1, itemSlots: safeItemSlots },
  csvShape: { distinctColumnCounts: sortedWidths, dominantColumnCount: sortedWidths[0]?.columns ?? null },
  exactTokenMatches: { configuredItem1_32003: exact.get(32003), fixedConfiguredItem_24114: exact.get(24114) },
  fieldChecks: { firstField32003: firstField.get(32003), firstField24114: firstField.get(24114), seventeenthField32003: seventeenthField.get(32003), seventeenthField24114: seventeenthField.get(24114) },
  matchingRowPreviews,
  interpretation: { fixedCFixedItemRuleApplied: false, note: 'Endpoint evidence only; pinned fixed-C Item ID semantics are not assumed.' }
};

process.stdout.write(JSON.stringify(result, null, 2) + '\n');