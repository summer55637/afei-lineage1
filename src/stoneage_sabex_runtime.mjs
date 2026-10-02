import { decodeSabexBuffer } from '../tools/parse_sabex.mjs';
import { resolveClientImageId } from './stoneage_client_image_runtime.mjs';

export const SABEX_RUNTIME_FORMAT = 'stoneage-sabex-client-image-runtime-v2';
export const TARGET_CG_INVISIBLE = 99;
export const TARGET_REAL_IMAGE_ID_MAX_EXCLUSIVE = 100000;
export const TARGET_GRAPHIC_NO_MAX_EXCLUSIVE = 600000;

export function classifySabexCell(imageId) {
  const id = Math.trunc(Number(imageId));
  if (!Number.isInteger(id) || id < 0 || id > 0xffff) {
    throw new RangeError('SABEX cell must be a uint16 value');
  }

  if (id <= TARGET_CG_INVISIBLE) {
    return {
      imageId: id,
      renderable: false,
      resolver: 'skipped',
      reason: 'target StockDispBuffer rejects bmpNo <= 99',
    };
  }

  return {
    imageId: id,
    renderable: true,
    resolver: id < TARGET_REAL_IMAGE_ID_MAX_EXCLUSIVE
      ? 'realGetNo'
      : 'out-of-range',
  };
}

export function resolveSabexClientImages(input, index, options = {}) {
  if (!index) throw new TypeError('ADRNBIN index is required');

  const decoded = Buffer.isBuffer(input)
    ? decodeSabexBuffer(input, {
        requireSabHeader: options.requireSabHeader ?? false,
        includeCells: true,
      })
    : input;

  const cells = decoded?.cells;
  if (!Array.isArray(cells) || cells.length !== 1089) {
    throw new Error('Expected decoded SABEX cells: 1089 values');
  }

  const resolved = new Array(cells.length);
  let mapped = 0;
  let unmapped = 0;
  let skippedInvisible = 0;
  let resolverCandidates = 0;

  for (let i = 0; i < cells.length; i++) {
    const classification = classifySabexCell(cells[i]);

    if (!classification.renderable) {
      resolved[i] = null;
      skippedInvisible++;
      continue;
    }

    resolverCandidates++;
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
    skippedInvisibleCount: skippedInvisible,
    resolverCandidateCount: resolverCandidates,
    mappedRatio: resolverCandidates ? mapped / resolverCandidates : 0,
    resolved,
  };
}
