#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SETUP = path.join(ROOT, 'ro0000/server/merged-source/gmsv/setup.cf');
const CSV = path.join(ROOT, 'ro0000/server/merged-source/gmsv/data/itemset6.csv');
const OUT = path.join(ROOT, 'data/generated/stoneage_endpoint_item_seed_audit.json');
const SERVER_BIN = path.join(ROOT, 'ro0000/server/merged-source/gmsv/gmsvjt');

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

function commandText(command, args) {
  try {
    return execFileSync(command, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  } catch (error) {
    return 'COMMAND_ERROR: ' + command + ' ' + args.join(' ') + '\n' + (error.stderr ? String(error.stderr) : error.message);
  }
}

function probeServerBinary() {
  if (!fs.existsSync(SERVER_BIN)) {
    return {
      present: false,
      path: 'ro0000/server/merged-source/gmsv/gmsvjt',
      status: 'missing'
    };
  }

  const fileInfo = commandText('file', [SERVER_BIN]).trim();
  const elfHeader = commandText('readelf', ['-h', SERVER_BIN]).trim();
  const symbolTable = commandText('readelf', ['-Ws', SERVER_BIN]);
  const interestingSymbols = symbolTable.split(/\r?\n/)
    .filter(line => /(ITEM_readItemConfFile|ITEM_makeItem|ITEM_makeItemAndRegist|ITEM_tblen|ITEM_TransformList)/.test(line))
    .slice(0, 100);

  const strings = commandText('strings', ['-a', SERVER_BIN]);
  const interestingStrings = strings.split(/\r?\n/)
    .filter(line => /(itemset6|ITEM1|ITEM2|ITEM_makeItem|ITEM_readItemConfFile|ITEM_tblen|TransformList|32003|24114)/i.test(line))
    .slice(0, 200);

  return {
    present: true,
    path: 'ro0000/server/merged-source/gmsv/gmsvjt',
    blobSha: gitSha('ro0000/server/merged-source/gmsv/gmsvjt'),
    fileInfo,
    elfType: elfHeader.match(/^\s*Type:\s*(.+)$/m)?.[1] ?? null,
    machine: elfHeader.match(/^\s*Machine:\s*(.+)$/m)?.[1] ?? null,
    strippedHint: symbolTable.includes('no symbols') || symbolTable.includes('There are no symbols'),
    interestingSymbols,
    interestingStrings,
    interpretation: {
      binaryInspectionIsEvidenceOnly: true,
      macroFlagsCannotBeProvenFromStringsAlone: true,
      purpose: 'Probe whether the deployed gmsvjt exposes a callable Item loader / transform surface distinct from the pinned source build.'
    }
  };
}

function probeItemLoaderDisassembly() {
  if (!fs.existsSync(SERVER_BIN)) return { available: false };

  const disassembly = commandText('objdump', [
    '-drwC', '-M', 'intel', '--disassemble=ITEM_readItemConfFile', SERVER_BIN
  ]);

  if (disassembly.startsWith('COMMAND_ERROR:')) {
    return { available: false, error: disassembly.slice(0, 1200) };
  }

  const lines = disassembly.split(/\r?\n/);
  const around = [];
  for (let i = 0; i < lines.length; i++) {
    if (/getStringFromIndexWithDelim/.test(lines[i])) {
      around.push(lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 6)));
      if (around.length >= 8) break;
    }
  }

  const constantEvidence = [];
  for (const block of around) {
    for (const line of block) {
      if (/\\b(?:mov|movabs|lea|push)\\b.*(?:0x11|17)/i.test(line)) constantEvidence.push(line);
    }
  }

  const tblenRefs = lines.filter(line => /ITEM_tblen/.test(line)).slice(0, 40);

  return {
    available: true,
    functionSymbol: 'ITEM_readItemConfFile',
    callsiteCount: around.length,
    callsites: around,
    constant17Evidence: constantEvidence,
    itemTblenReferences: tblenRefs,
    interpretation: {
      purpose: 'Observe compiled endpoint loader call arguments without assuming fixed-C source semantics.',
      token17IsProven: constantEvidence.length > 0,
      caution: 'A constant 17 near a parser call is evidence only; final ID semantics still require correlating the exact callsite and parsed assignment.'
    }
  };
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

  const rawText = raw.toString('latin1');
  const substring32003 = [];
  for (const match of rawText.matchAll(/32003/g)) {
    const before = Math.max(0, match.index - 24);
    const after = Math.min(rawText.length, match.index + 29);
    substring32003.push(rawText.slice(before, after));
    if (substring32003.length >= 20) break;
  }

  const token17Stats = {
    rowsWithToken17: 0,
    distinctIds: new Set(),
    duplicateIds: 0,
    maxId: 0,
    configured32003: 0,
    fixed24114: 0
  };
  for (const line of lines) {
    const tokens = line.split(',');
    if (tokens.length < 17) continue;
    token17Stats.rowsWithToken17++;
    const id = Number(tokens[16].trim());
    if (!Number.isInteger(id)) continue;
    if (token17Stats.distinctIds.has(id)) token17Stats.duplicateIds++;
    token17Stats.distinctIds.add(id);
    token17Stats.maxId = Math.max(token17Stats.maxId, id);
    if (id === 32003) token17Stats.configured32003++;
    if (id === 24114) token17Stats.fixed24114++;
  }

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
      dominantColumnCount: sortedWidths[0]?.columns ?? null,
      rawSubstring32003Count: (rawText.match(/32003/g) ?? []).length,
      rawSubstring32003Samples: substring32003,
      fixedCShapeToken17Probe: {
        rowsWithToken17: token17Stats.rowsWithToken17,
        distinctIds: token17Stats.distinctIds.size,
        duplicateIds: token17Stats.duplicateIds,
        maxId: token17Stats.maxId,
        configured32003: token17Stats.configured32003,
        fixed24114: token17Stats.fixed24114
      }
    },
    serverBinaryProbe: probeServerBinary(),
    itemLoaderDisassemblyProbe: probeItemLoaderDisassembly(),
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
      note: 'Endpoint evidence only. This audit intentionally does not assume pinned fixed-C ITEM_ID_TOKEN_INDEX or ID-remap semantics.',
      nextClosureBoundary: 'Because configured ITEM1=32003 is absent even as a raw substring from the selected endpoint CSV, the remaining decisive evidence layer is the deployed gmsvjt loader/transform behavior and any endpoint-specific Item data source it consumes.',
      token17ProbeIsHypothesisOnly: true
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
