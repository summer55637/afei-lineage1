const SPRADRN_RECORD_BYTES = 12;
const SPR_ANIMATION_HEADER_BYTES = 12;
const SPR_FRAME_RECORD_BYTES = 10;
const SPR_RUNTIME_FRAME_STRIDE_BYTES = 12;
const SPRITE_START_ID = 100000;
const SPRITE_CAPACITY = 40000;
const U32_MAX = 0xffffffff;

function asBytes(input, label) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new TypeError(label + ' input must be byte data');
}
function need(bytes, offset, length, label) {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0
      || offset + length > bytes.byteLength) {
    throw new Error(label + ' truncated or out of range at byte ' + offset);
  }
}
function checkU32(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > U32_MAX) {
    throw new RangeError(label + ' must be an unsigned 32-bit integer');
  }
  return value;
}
function viewOf(bytes) { return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); }

/**
 * Parse target SPRADRN records. The original ELF guard admits slot 40000,
 * despite allocating only 40000 SpriteData entries; this parser rejects it.
 */
export function parseSprAdrnIndex(input) {
  const bytes = asBytes(input, 'SPRADRN');
  if (bytes.byteLength % SPRADRN_RECORD_BYTES !== 0) {
    throw new Error('SPRADRN byte length is not a multiple of 12');
  }
  const view = viewOf(bytes);
  const entries = [];
  const seenSlots = new Set();
  for (let offset = 0; offset < bytes.byteLength; offset += SPRADRN_RECORD_BYTES) {
    const sprNo = view.getUint32(offset, true);
    const fileOffset = view.getUint32(offset + 4, true);
    const animSize = view.getUint16(offset + 8, true);
    const padding = view.getUint16(offset + 10, true);
    if (sprNo < SPRITE_START_ID) {
      throw new RangeError('SPRADRN sprNo is below the target sprite namespace: ' + sprNo);
    }
    const slot = sprNo - SPRITE_START_ID;
    if (slot >= SPRITE_CAPACITY) {
      throw new RangeError('SPRADRN sprite slot is outside allocated SpriteData: ' + slot);
    }
    if (seenSlots.has(slot)) throw new Error('duplicate SPRADRN sprite slot: ' + slot);
    seenSlots.add(slot);
    entries.push({ sprNo, slot, offset: fileOffset, animSize, padding, recordOffset: offset });
  }
  return {
    format: 'stoneage-spradrn-index-v1',
    recordSizeBytes: SPRADRN_RECORD_BYTES,
    spriteStartId: SPRITE_START_ID,
    spriteCapacity: SPRITE_CAPACITY,
    entries,
  };
}

/** Parse little-endian animation headers and 10-byte on-disk frame records. */
export function parseSprAnimationPack(indexInput, sprInput, { nextMaxAdrnID = 0 } = {}) {
  const index = parseSprAdrnIndex(indexInput);
  const sprBytes = asBytes(sprInput, 'SPR');
  const view = viewOf(sprBytes);
  const base = checkU32(nextMaxAdrnID, 'nextMaxAdrnID');
  const sprites = index.entries.map((entry) => {
    if (entry.offset > sprBytes.byteLength) {
      throw new Error('SPR offset is outside spr.bin for sprite slot ' + entry.slot);
    }
    const minimumHeaderBytes = entry.animSize * SPR_ANIMATION_HEADER_BYTES;
    if (!Number.isSafeInteger(minimumHeaderBytes)
        || minimumHeaderBytes > sprBytes.byteLength - entry.offset) {
      throw new Error('SPR animation headers exceed spr.bin for sprite slot ' + entry.slot);
    }
    let cursor = entry.offset;
    const animations = [];
    for (let animationIndex = 0; animationIndex < entry.animSize; animationIndex += 1) {
      need(sprBytes, cursor, SPR_ANIMATION_HEADER_BYTES, 'SPR animation header');
      const headerOffset = cursor;
      const dir = view.getUint16(cursor, true);
      const no = view.getUint16(cursor + 2, true);
      const sourceDtAnim = view.getUint32(cursor + 4, true);
      const frameCount = view.getUint32(cursor + 8, true);
      cursor += SPR_ANIMATION_HEADER_BYTES;
      const frameBytes = frameCount * SPR_FRAME_RECORD_BYTES;
      if (!Number.isSafeInteger(frameBytes) || frameBytes > sprBytes.byteLength - cursor) {
        throw new Error('SPR frame records exceed spr.bin for sprite slot ' + entry.slot
          + ', animation ' + animationIndex);
      }
      const frames = [];
      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        const localBmpNo = view.getUint32(cursor, true);
        const posX = view.getInt16(cursor + 4, true);
        const posY = view.getInt16(cursor + 6, true);
        const soundNo = view.getUint16(cursor + 8, true);
        frames.push({ localBmpNo, bmpNo: (localBmpNo + base) >>> 0, posX, posY, soundNo });
        cursor += SPR_FRAME_RECORD_BYTES;
      }
      animations.push({
        index: animationIndex,
        sourceOffset: headerOffset,
        dir,
        no,
        sourceDtAnim,
        dtAnim: frameCount === 0 ? 0 : Math.trunc(sourceDtAnim / frameCount / 16),
        frameCount,
        frames,
      });
    }
    return {
      sprNo: entry.sprNo,
      slot: entry.slot,
      indexOffset: entry.recordOffset,
      fileOffset: entry.offset,
      animSize: entry.animSize,
      padding: entry.padding,
      parsedEndOffset: cursor,
      animations,
    };
  });
  return {
    format: 'stoneage-spr-animation-pack-v1',
    spriteStartId: SPRITE_START_ID,
    spriteCapacity: SPRITE_CAPACITY,
    sprAdrnRecordBytes: SPRADRN_RECORD_BYTES,
    animationHeaderBytes: SPR_ANIMATION_HEADER_BYTES,
    frameRecordBytes: SPR_FRAME_RECORD_BYTES,
    runtimeFrameStrideBytes: SPR_RUNTIME_FRAME_STRIDE_BYTES,
    nextMaxAdrnID: base,
    sprites,
  };
}

function cloneSprites(sprites) {
  if (!Array.isArray(sprites)) throw new TypeError('sprites must be an array');
  const seen = new Set();
  return sprites.map((sprite) => {
    if (!sprite || !Number.isInteger(sprite.slot) || sprite.slot < 0 || sprite.slot >= SPRITE_CAPACITY
        || !Array.isArray(sprite.animations)) {
      throw new TypeError('sprite entry does not match parsed SPR structure');
    }
    if (seen.has(sprite.slot)) throw new Error('duplicate sprite slot in fixup input: ' + sprite.slot);
    seen.add(sprite.slot);
    return {
      ...sprite,
      animations: sprite.animations.map((animation) => {
        if (!animation || !Array.isArray(animation.frames)) {
          throw new TypeError('animation entry does not match parsed SPR structure');
        }
        return { ...animation, frames: animation.frames.map((frame) => ({ ...frame })) };
      }),
    };
  });
}
function requiredAnimation(sprite, index, fixupName) {
  const animation = sprite?.animations?.[index];
  if (!animation) throw new Error(fixupName + ' requires sprite slot ' + sprite?.slot
    + ' animation ' + index);
  return animation;
}
function requiredFrame(animation, index, fixupName, spriteSlot) {
  const frame = animation?.frames?.[index];
  if (!frame) throw new Error(fixupName + ' requires sprite slot ' + spriteSlot + ' frame ' + index);
  return frame;
}

/**
 * Apply target post-load corrections to a cloned inventory. Call after all
 * relevant SPR shards have been combined so slot 382 can read slot 381.
 */
export function applyTargetSpritePostLoadFixups(inputSprites) {
  const sprites = cloneSprites(inputSprites);
  const bySlot = new Map(sprites.map((sprite) => [sprite.slot, sprite]));
  const appliedFixups = [];
  const slot260 = bySlot.get(260);
  if (slot260) {
    requiredFrame(requiredAnimation(slot260, 21, 'slot-260 fixup'), 5, 'slot-260 fixup', 260).soundNo = 10001;
    appliedFixups.push({ slot: 260, kind: 'sound-cue-overwrite', animationIndex: 21, frameIndex: 5 });
  }
  const slot373 = bySlot.get(373);
  if (slot373) {
    for (let i = 0; i <= 7; i += 1) {
      const animationIndex = 7 * i;
      const animation = requiredAnimation(slot373, animationIndex, 'slot-373 fixup');
      requiredFrame(animation, 8, 'slot-373 fixup', 373).soundNo = 254;
      requiredFrame(animation, 10, 'slot-373 fixup', 373).soundNo = 254;
      requiredFrame(animation, 15, 'slot-373 fixup', 373).soundNo = 250;
    }
    appliedFixups.push({ slot: 373, kind: 'sound-cue-overwrite', animationCount: 8 });
  }
  const slot382 = bySlot.get(382);
  if (slot382) {
    const sourceSprite = bySlot.get(381);
    if (!sourceSprite) throw new Error('slot-382 fixup requires source sprite slot 381');
    const sourceAnimation = requiredAnimation(sourceSprite, 0, 'slot-382 source');
    const sound4 = requiredFrame(sourceAnimation, 4, 'slot-382 source', 381).soundNo;
    const sound9 = requiredFrame(sourceAnimation, 9, 'slot-382 source', 381).soundNo;
    for (let i = 0; i <= 7; i += 1) {
      const animationIndex = 7 * i;
      const animation = requiredAnimation(slot382, animationIndex, 'slot-382 fixup');
      const first = requiredFrame(animation, 0, 'slot-382 fixup', 382).bmpNo;
      animation.frameCount = 14;
      animation.dtAnim = sourceAnimation.dtAnim;
      animation.frames = Array.from({ length: 14 }, (_, frameIndex) => ({
        localBmpNo: null,
        bmpNo: (first + 1 + frameIndex) >>> 0,
        posX: 0,
        posY: 0,
        soundNo: frameIndex === 4 ? sound4 : frameIndex === 9 ? sound9 : 0,
      }));
    }
    appliedFixups.push({ slot: 382, kind: 'rebuild-frame-sequences', animationCount: 8, frameCount: 14 });
  }
  const slot820 = bySlot.get(820);
  if (slot820) {
    for (let i = 0; i <= 7; i += 1) {
      const animationIndex = 7 * i + 5;
      const animation = requiredAnimation(slot820, animationIndex, 'slot-820 fixup');
      for (const frame of animation.frames) frame.soundNo = 0;
    }
    appliedFixups.push({ slot: 820, kind: 'clear-sound-cues', animationCount: 8 });
  }
  return { sprites, appliedFixups };
}

export const TARGET_SPRITE_LAYOUT = Object.freeze({
  sprAdrnRecordBytes: SPRADRN_RECORD_BYTES,
  animationHeaderBytes: SPR_ANIMATION_HEADER_BYTES,
  frameRecordBytes: SPR_FRAME_RECORD_BYTES,
  runtimeFrameStrideBytes: SPR_RUNTIME_FRAME_STRIDE_BYTES,
  spriteStartId: SPRITE_START_ID,
  spriteCapacity: SPRITE_CAPACITY,
  spriteEndExclusive: SPRITE_START_ID + SPRITE_CAPACITY,
});
