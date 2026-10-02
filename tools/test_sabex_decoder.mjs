#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  decodeSabexBuffer,
  SABEX_CELL_COUNT,
  SABEX_MIN_SIZE,
} from './parse_sabex.mjs';

const buffer = Buffer.alloc(SABEX_MIN_SIZE + 3, 0);
buffer.write('SABX', 0, 4, 'ascii');
buffer.writeUInt16BE(0x1234, 4);
buffer.writeUInt16BE(0xabcd, 4 + (SABEX_CELL_COUNT - 1) * 2);

const result = decodeSabexBuffer(buffer, { requireSabHeader: true, includeCells: true });
assert.equal(result.header, 'SABX');
assert.equal(result.headerContainsSAB, true);
assert.equal(result.payloadBytes, SABEX_MIN_SIZE + 3);
assert.equal(result.minimumBytes, SABEX_MIN_SIZE);
assert.equal(result.trailingBytes, 3);
assert.equal(result.grid.width, 33);
assert.equal(result.grid.height, 33);
assert.equal(result.grid.cells, 1089);
assert.equal(result.cells[0], 0x1234);
assert.equal(result.cells[1088], 0xabcd);
assert.equal(result.tileStats.distinct, 3);
assert.equal(result.sha256.length, 64);

const nonSabHeader = Buffer.alloc(SABEX_MIN_SIZE);
nonSabHeader.write('XXXX', 0, 4, 'ascii');
assert.doesNotThrow(() => decodeSabexBuffer(nonSabHeader));
assert.throws(
  () => decodeSabexBuffer(nonSabHeader, { requireSabHeader: true }),
  /does not contain "SAB"/,
);
assert.throws(
  () => decodeSabexBuffer(Buffer.alloc(SABEX_MIN_SIZE - 1)),
  /payload too short/,
);

console.log('SABEX decoder tests passed');
