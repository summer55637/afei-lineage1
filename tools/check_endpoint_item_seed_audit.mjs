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
    .filter(line => /(ITEM_readItemConfFile|ITEM_makeItem|ITEM_makeItemAndRegist|ITEM_tblen|ITEM_readItemConfFile|ITEM_makeItem|ITEM_makeItemAndRegist|ITEM_tblen|ITEM_TransformList|ITEM_getSIndexFromTransList|ITEM_tbl|CHAR_loginAddItemForNew|getNewplayergiveitem|getNewplayergivegold)/.test(line))
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
      if (/\b(?:mov|movabs|lea|push)\b.*(?:0x11|17)/i.test(line)) constantEvidence.push(line);
    }
  }

  const firstParserIndex = lines.findIndex(line => /getStringFromIndexWithDelim/.test(line));
  const idScanWindow = firstParserIndex >= 0
    ? lines.slice(Math.max(0, firstParserIndex - 10), Math.min(lines.length, firstParserIndex + 50))
    : [];
  const idScanAtoi = idScanWindow.filter(line => /<atoi(?:@|\b)/.test(line)).slice(0, 10);
  const tblenRefs = lines.filter(line => /ITEM_tblen/.test(line)).slice(0, 40);
  const loaderIndexRefs = lines.filter(line => /ITEM_idx/.test(line)).slice(0, 80);
  const loaderIndexWindows = [];
  const allItemIndexContexts = commandText('bash', [
    '-lc',
    "set -e; objdump -drwC -M intel --section=.text " + SERVER_BIN + " | grep -n -C 10 '9ed968 <ITEM_idx>' | head -n 360 || true"
  ]).split(/\r?\n/);
  const itemIndexSymbols = commandText('readelf', ['-Ws', SERVER_BIN])
    .split(/\r?\n/)
    .filter(line => /ITEM_idx|ITEM_tblen|ITEM_tbl/.test(line))
    .slice(0, 120);
  const itemIdxLenContexts = commandText('bash', [
    '-lc',
    "set -e; objdump -drwC -M intel --section=.text " + SERVER_BIN + " | grep -n -C 12 '9ed974 <ITEM_idxlen>' | head -n 320 || true"
  ]).split(/\r?\n/);
  const loaderPopulationRange = commandText('objdump', [
    '-drwC', '-M', 'intel', '--start-address=0x583300', '--stop-address=0x583590', SERVER_BIN
  ]).split(/\r?\n/);
  const makeItemRange = commandText('objdump', [
    '-drwC', '-M', 'intel', '--start-address=0x5848b0', '--stop-address=0x584a90', SERVER_BIN
  ]).split(/\r?\n/);
  const checkItemRange = commandText('objdump', [
    '-drwC', '-M', 'intel', '--start-address=0x586bd0', '--stop-address=0x586c40', SERVER_BIN
  ]).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/ITEM_idx/.test(lines[i])) {
      loaderIndexWindows.push(lines.slice(Math.max(0, i - 8), Math.min(lines.length, i + 12)));
    }
  }

  const makeDisassembly = commandText('objdump', [
    '-drwC', '-M', 'intel', '--disassemble=ITEM_makeItem', SERVER_BIN
  ]);
  const makeLines = makeDisassembly.split(/\r?\n/);
  const makeTransformCalls = makeLines.filter(line => /ITEM_getSIndexFromTransList/.test(line)).slice(0, 40);
  const makeItemTableRefs = makeLines.filter(line => /ITEM_tbl/.test(line)).slice(0, 60);
  const makeItemIndexRefs = makeLines.filter(line => /ITEM_idx/.test(line)).slice(0, 60);
  const makeItemTableWindows = [];
  for (let i = 0; i < makeLines.length; i++) {
    if (/ITEM_tbl/.test(makeLines[i])) {
      makeItemTableWindows.push(makeLines.slice(Math.max(0, i - 8), Math.min(makeLines.length, i + 10)));
    }
  }

  const makeHead = makeLines.slice(0, 170);
  const makeAndRegDisassembly = commandText('objdump', [
    '-drwC', '-M', 'intel', '--disassemble=ITEM_makeItemAndRegist', SERVER_BIN
  ]);
  const makeAndRegLines = makeAndRegDisassembly.split(/\r?\n/);

  const checkSymbolDisassembly = commandText('objdump', [
    '-drwC', '-M', 'intel', '--disassemble=_ITEM_CHECKITEMTABLE', SERVER_BIN
  ]);
  const checkSymbolLines = checkSymbolDisassembly.split(/\r?\n/);

  const grantDisassembly = commandText('objdump', [
    '-drwC', '-M', 'intel', '--disassemble=CHAR_loginAddItemForNew', SERVER_BIN
  ]);
  const grantLines = grantDisassembly.split(/\r?\n/);
  const grantItemCalls = grantLines.filter(line => /ITEM_makeItemAndRegist|getNewplayergiveitem/.test(line)).slice(0, 80);
  const grantCallWindows = [];
  for (let i = 0; i < grantLines.length; i++) {
    if (/ITEM_makeItemAndRegist/.test(grantLines[i])) {
      grantCallWindows.push(grantLines.slice(Math.max(0, i - 10), Math.min(grantLines.length, i + 6)));
    }
  }

  const getterDisassembly = commandText('objdump', [
    '-drwC', '-M', 'intel', '--disassemble=getNewplayergiveitem', SERVER_BIN
  ]);
  const getterLines = getterDisassembly.split(/\r?\n/);

  return {
    available: true,
    functionSymbol: 'ITEM_readItemConfFile',
    callsiteCount: around.length,
    callsites: around,
    constant17Evidence: constantEvidence,
    idScanWindow,
    idScanAtoiCalls: idScanAtoi,
    itemTblenReferences: tblenRefs,
    loaderItemIndexReferences: loaderIndexRefs,
    loaderItemIndexWindows: loaderIndexWindows,
    allItemIndexContexts,
    itemIndexSymbols,
    itemIdxLenContexts,
    loaderPopulationRange,
    makeItemRange,
    checkItemRange,
    makeItemDisassembly: {
      head: makeHead,
      transformCalls: makeTransformCalls,
      itemTableReferences: makeItemTableRefs,
      itemIndexReferences: makeItemIndexRefs,
      itemTableWindows: makeItemTableWindows,
      makeAndRegLines: makeAndRegLines.slice(0, 140),
      checkItemTableDisassembly: checkSymbolLines.slice(0, 140)
    },
    newPlayerGrant: {
      grantItemCalls,
      grantCallWindows,
      getterWindow: getterLines.slice(0, 100)
    },
    interpretation: {
      purpose: 'Observe compiled endpoint loader and make-item lookup behavior without assuming fixed-C source semantics.',
      token17IsProven: constantEvidence.length > 0,
      directMakeItemTransformObserved: makeTransformCalls.length > 0,
      directItemTableAccessObserved: makeItemTableRefs.length > 0,
      itemIndexAccessObserved: makeItemIndexRefs.length > 0,
      itemIndexIsPopulatedByLoader: loaderPopulationRange.some(line => /9ed968 <ITEM_idx>|ITEM_idx/.test(line)),
      itemIndexLengthObserved: itemIdxLenContexts.length > 0,
      itemCheckTableSymbolObserved: checkSymbolLines.some(line => /_ITEM_CHECKITEMTABLE/.test(line)),
      newPlayerGrantChainObserved: grantItemCalls.some(line => /ITEM_makeItemAndRegist/.test(line)),
      newPlayerItemGetterObserved: getterLines.some(line => /getNewplayergiveitem/.test(line)),
      caution: 'Compiled binary evidence is correlated with symbols and callsites; absence of a transform symbol is evidence against that implementation, not proof that every possible mapping mechanism is absent.'
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
  const itemLoaderProof = probeItemLoaderDisassembly();
  const loaderIdAssignmentClosed =
    itemLoaderProof.idScanAtoiCalls.length > 0
    && itemLoaderProof.idScanWindow.some(line => /mov\s+DWORD PTR \[rbp-0x24\],eax/.test(line));
  const makeAndRegDirectForward =
    itemLoaderProof.makeItemDisassembly.makeAndRegLines.some(line => /call .*<ITEM_makeItem>/.test(line))
    && itemLoaderProof.makeItemDisassembly.makeAndRegLines.some(line => /mov\s+esi,edx/.test(line));
  const checkItemTableUsesPresenceFlag =
    itemLoaderProof.checkItemRange.some(line => /mov\s+eax,DWORD PTR \[rax\]/.test(line))
    && itemLoaderProof.checkItemRange.some(line => /ITEM_idx/.test(line));
  const endpointItemIdLookupSemanticsClosed =
    itemLoaderProof.interpretation.token17IsProven
    && loaderIdAssignmentClosed
    && itemLoaderProof.interpretation.itemIndexIsPopulatedByLoader
    && makeAndRegDirectForward
    && checkItemTableUsesPresenceFlag
    && itemLoaderProof.interpretation.newPlayerGrantChainObserved;

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
    status: configured32003.length > 0 ? 'endpoint-seed-candidate-found' : (endpointItemIdLookupSemanticsClosed ? 'fail-closed-missing-source-item-id' : 'unresolved'),
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
    itemLoaderDisassemblyProbe: itemLoaderProof,
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
      endpointSemanticsClosed: endpointItemIdLookupSemanticsClosed,
      configuredItem1HasSourceRow: configured32003.length > 0,
      configuredItem1LookupWouldPass: endpointItemIdLookupSemanticsClosed && configured32003.length > 0,
      configuredItem1LookupWouldFailClosed: endpointItemIdLookupSemanticsClosed && configured32003.length === 0
    },
    resolution: configured32003.length > 0
      ? {
          status: 'candidate',
          rule: '32003 exists in selected endpoint itemset6.csv; continue field-semantic audit before canonicalization.'
        }
      : endpointItemIdLookupSemanticsClosed
        ? {
            status: 'fail-closed',
            reason: 'Endpoint loader semantics are closed: token 17 is parsed into the Item-ID variable, ITEM_idx is populated by parsed Item ID plus sequential table index, ITEM_CHECKITEMTABLE checks ITEM_idx[ID], and new-player grant forwards the configured value directly to ITEM_makeItemAndRegist. Because endpoint itemset6.csv contains no source Item ID 32003, ITEM1=32003 fails the endpoint Item table lookup.',
            secondaryEvidence: fixed24114.length > 0
              ? 'The same endpoint itemset6.csv contains one 24114 occurrence at token 18; this is not evidence of source Item ID 24114.'
              : 'The selected endpoint Item table contains neither configured 32003 nor 24114 as an exact numeric token.'
          }
        : {
            status: 'unresolved',
            reason: 'setup.cf explicitly configures ITEM1=32003, but endpoint loader semantics are not fully closed yet. Do not remap or substitute another item.',
            secondaryEvidence: fixed24114.length > 0
              ? 'The same endpoint itemset6.csv contains one 24114 occurrence.'
              : 'The selected endpoint Item table contains neither configured 32003 nor 24114 as an exact numeric token.'
          },
    interpretation: {
      fixedCFixedItemRuleApplied: false,
      note: 'Endpoint evidence only. Item-ID behavior here is derived from the deployed gmsvjt binary, not copied from fixed-C macro assumptions.',
      token17IsProven: itemLoaderProof.interpretation.token17IsProven,
      loaderIdAssignmentClosed,
      itemIndexIsPopulatedByLoader: itemLoaderProof.interpretation.itemIndexIsPopulatedByLoader,
      checkItemTableUsesPresenceFlag,
      makeAndRegDirectForward,
      endpointItemIdLookupSemanticsClosed,
      nextClosureBoundary: endpointItemIdLookupSemanticsClosed
        ? 'Current endpoint snapshot is source-closed for the configured Item lookup. ITEM1=32003 has no source row, so keep starter-item grant fail-closed unless new authoritative endpoint evidence changes the configured ID or mapping.'
        : 'Continue deployed gmsvjt Item execution audit before resolving the endpoint starter-item boundary.'
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
