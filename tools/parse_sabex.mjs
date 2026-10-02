#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

export const SABEX_HEADER_SIZE = 4;
export const SABEX_GRID_SIZE = 33;
export const SABEX_CELL_COUNT = SABEX_GRID_SIZE * SABEX_GRID_SIZE;
export const SABEX_CELL_SIZE = 2;
export const SABEX_MIN_SIZE = SABEX_HEADER_SIZE + SABEX_CELL_COUNT * SABEX_CELL_SIZE;

function topFrequencies(cells, limit = 20) {
  const counts = new Map();
  for (const value of cells) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

export function decodeSabexBuffer(buffer, options = {}) {
  const requireSabHeader = options.requireSabHeader ?? false;
  const includeCells = options.includeCells ?? false;

  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('decodeSabexBuffer expects a Node Buffer');
  }
  if (buffer.length < SABEX_MIN_SIZE) {
    throw new Error(
      'SABEX payload too short: ' + buffer.length +
      ' bytes; minimum is ' + SABEX_MIN_SIZE,
    );
  }

  const headerBytes = buffer.subarray(0, SABEX_HEADER_SIZE);
  const header = headerBytes.toString('latin1');
  const headerContainsSAB = header.includes('SAB');
  if (requireSabHeader && !headerContainsSAB) {
    throw new Error(
      'SABEX header does not contain "SAB": ' + JSON.stringify(header),
    );
  }

  const cells = new Array(SABEX_CELL_COUNT);
  for (let i = 0, offset = SABEX_HEADER_SIZE; i < SABEX_CELL_COUNT; i++, offset += 2) {
    cells[i] = buffer.readUInt16BE(offset);
  }

  let min = 0xffff;
  let max = 0;
  let zeroCount = 0;
  for (const value of cells) {
    if (value < min) min = value;
    if (value > max) max = value;
    if (value === 0) zeroCount++;
  }

  const result = {
    format: 'stoneage-sabex-audit-v1',
    header,
    headerHex: headerBytes.toString('hex'),
    headerContainsSAB,
    payloadBytes: buffer.length,
    minimumBytes: SABEX_MIN_SIZE,
    trailingBytes: buffer.length - SABEX_MIN_SIZE,
    grid: {
      width: SABEX_GRID_SIZE,
      height: SABEX_GRID_SIZE,
      cells: SABEX_CELL_COUNT,
      cellEncoding: 'uint16be',
    },
    tileStats: {
      distinct: new Set(cells).size,
      min,
      max,
      zeroCount,
      topFrequencies: topFrequencies(cells),
    },
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  };

  if (includeCells) result.cells = cells;
  return result;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.error(
      'Usage: node tools/parse_sabex.mjs <file.sabex> [--out <file.json>] [--require-sab] [--cells]',
    );
    process.exit(args.length === 0 ? 2 : 0);
  }

  const file = args[0];
  const outIndex = args.indexOf('--out');
  const out = outIndex >= 0 ? args[outIndex + 1] : null;
  if (outIndex >= 0 && !out) throw new Error('--out requires a path');

  const result = decodeSabexBuffer(
    fs.readFileSync(file),
    {
      requireSabHeader: args.includes('--require-sab'),
      includeCells: args.includes('--cells'),
    },
  );
  const serialized = JSON.stringify(result, null, 2) + '\n';

  if (out) {
    fs.writeFileSync(out, serialized);
    console.log('Wrote ' + out);
  } else {
    process.stdout.write(serialized);
  }
}

if (import.meta.url === 'file://' + process.argv[1]) {
  main(process.argv);
}
