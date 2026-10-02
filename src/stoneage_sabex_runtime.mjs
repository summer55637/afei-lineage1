import { decodeSabexBuffer } from '../tools/parse_sabex.mjs';
import { resolveClientImageId } from './stoneage_client_image_runtime.mjs';

export const SABEX_RUNTIME_FORMAT = 'stoneage-sabex-client-image-runtime-v1';

export function resolveSabexClientImages(input, index, options = {}) {
  if (!index) throw new TypeError('ADRNBIN index is required');
  const decoded = Buffer.isBuffer(input)
    ? decodeSabexBuffer(input, { requireSabHeader: options.requireSabHeader ?? false, includeCells: true })
    : input;

  const cells = decoded?.cells;
  if (!Array.isArray(cells) || cells.length !== 1089) {
    throw new Error('Expected decoded SABEX cells: 1089 values');
  }

  const resolved = new Array(cells.length);
  let mapped = 0;
  let unmapped = 0;

  for (let i = 0; i < cells.length; i++) {
    const image = resolveClientImageId(index, cells[i]);
    resolved[i] = image;
    if (image) mapped++;
    else unmapped++;
  }

  return {
    format: SABEX_RUNTIME_FORMAT,
    mapNo: options.mapNo ?? null,
    grid: { width: 33, height: 33, cells: 1089 },
    tileIds: cells,
    mappedCount: mapped,
    unmappedCount: unmapped,
    mappedRatio: cells.length ? mapped / cells.length : 0,
    resolved,
  };
}
