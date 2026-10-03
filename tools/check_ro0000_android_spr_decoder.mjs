import assert from 'node:assert/strict';
import {
  applyTargetSpritePostLoadFixups,
  parseSprAdrnIndex,
  parseSprAnimationPack,
  TARGET_SPRITE_LAYOUT,
} from '../src/stoneage_spr_decoder.mjs';

const putU16 = (bytes, offset, value) => {
  const v = value & 0xffff;
  bytes[offset] = v & 0xff;
  bytes[offset + 1] = v >>> 8;
};
const putU32 = (bytes, offset, value) => {
  const v = value >>> 0;
  bytes[offset] = v & 0xff;
  bytes[offset + 1] = (v >>> 8) & 0xff;
  bytes[offset + 2] = (v >>> 16) & 0xff;
  bytes[offset + 3] = (v >>> 24) & 0xff;
};
function makeFrame(index = 0, { bmpNo = 40 + index, posX = 0, posY = 0, soundNo = 7 } = {}) {
  return { bmpNo, posX, posY, soundNo };
}
function makeAnimation(frameCount = 1, { dir = 2, no = 3, dtAnim = 320, soundNo = 7, firstBmpNo = 40 } = {}) {
  return {
    dir, no, dtAnim,
    frames: Array.from({ length: frameCount }, (_, i) =>
      makeFrame(i, { bmpNo: firstBmpNo + i, posX: i - 1, posY: 3 - i, soundNo: soundNo + i })),
  };
}
function encodeAnimation(animation) {
  const bytes = new Uint8Array(12 + animation.frames.length * 10);
  putU16(bytes, 0, animation.dir);
  putU16(bytes, 2, animation.no);
  putU32(bytes, 4, animation.dtAnim);
  putU32(bytes, 8, animation.frames.length);
  let p = 12;
  for (const frame of animation.frames) {
    putU32(bytes, p, frame.bmpNo);
    putU16(bytes, p + 4, frame.posX);
    putU16(bytes, p + 6, frame.posY);
    putU16(bytes, p + 8, frame.soundNo);
    p += 10;
  }
  return bytes;
}
function encodePack(sprites) {
  const blobs = sprites.map((sprite) => sprite.animations.map(encodeAnimation));
  const lengths = blobs.map((items) => items.reduce((sum, bytes) => sum + bytes.length, 0));
  const sprBytes = new Uint8Array(lengths.reduce((sum, n) => sum + n, 0));
  const indexBytes = new Uint8Array(sprites.length * 12);
  let offset = 0;
  for (let i = 0; i < sprites.length; i += 1) {
    const p = i * 12;
    putU32(indexBytes, p, sprites[i].sprNo);
    putU32(indexBytes, p + 4, offset);
    putU16(indexBytes, p + 8, sprites[i].animations.length);
    putU16(indexBytes, p + 10, 0x5a5a);
    for (const bytes of blobs[i]) {
      sprBytes.set(bytes, offset);
      offset += bytes.length;
    }
  }
  return { indexBytes, sprBytes };
}

const basic = encodePack([{
  sprNo: 100000,
  animations: [makeAnimation(2, { dtAnim: 320, firstBmpNo: 42, soundNo: 11 })],
}]);
const parsed = parseSprAnimationPack(basic.indexBytes, basic.sprBytes, { nextMaxAdrnID: 500 });
assert.equal(parsed.format, 'stoneage-spr-animation-pack-v1');
assert.equal(parsed.sprites.length, 1);
assert.equal(parsed.sprites[0].slot, 0);
assert.equal(parsed.sprites[0].padding, 0x5a5a);
assert.equal(parsed.sprites[0].animations[0].dir, 2);
assert.equal(parsed.sprites[0].animations[0].no, 3);
assert.equal(parsed.sprites[0].animations[0].sourceDtAnim, 320);
assert.equal(parsed.sprites[0].animations[0].dtAnim, 10);
assert.equal(parsed.sprites[0].animations[0].frameCount, 2);
assert.deepEqual(parsed.sprites[0].animations[0].frames[0], {
  localBmpNo: 42, bmpNo: 542, posX: -1, posY: 3, soundNo: 11,
});
assert.deepEqual(TARGET_SPRITE_LAYOUT, {
  sprAdrnRecordBytes: 12, animationHeaderBytes: 12, frameRecordBytes: 10,
  runtimeFrameStrideBytes: 12, spriteStartId: 100000, spriteCapacity: 40000,
  spriteEndExclusive: 140000,
});

const wrappedIndex = new Uint8Array(basic.indexBytes.length + 6);
wrappedIndex.set(basic.indexBytes, 3);
const wrappedSpr = new Uint8Array(basic.sprBytes.length + 8);
wrappedSpr.set(basic.sprBytes, 4);
assert.equal(parseSprAnimationPack(
  wrappedIndex.subarray(3, 3 + basic.indexBytes.length),
  wrappedSpr.subarray(4, 4 + basic.sprBytes.length),
).sprites[0].animations[0].frames[1].bmpNo, 43);
assert.equal(parseSprAnimationPack(new Uint8Array(0), new Uint8Array(0)).sprites.length, 0);

// Sprite namespace bounds and malformed input admission.
for (const sprNo of [100000, 139999]) {
  const valid = new Uint8Array(12);
  putU32(valid, 0, sprNo);
  assert.equal(parseSprAdrnIndex(valid).entries[0].slot, sprNo - 100000);
}
const tooHigh = new Uint8Array(12);
putU32(tooHigh, 0, 140000);
assert.throws(() => parseSprAdrnIndex(tooHigh), /outside allocated SpriteData/);
const tooLow = new Uint8Array(12);
putU32(tooLow, 0, 99999);
assert.throws(() => parseSprAdrnIndex(tooLow), /below the target sprite namespace/);
assert.throws(() => parseSprAdrnIndex(new Uint8Array(13)), /multiple of 12/);
const duplicate = new Uint8Array(24);
putU32(duplicate, 0, 100001);
putU32(duplicate, 12, 100001);
assert.throws(() => parseSprAdrnIndex(duplicate), /duplicate SPRADRN sprite slot/);

// Reject offsets, headers, and frame arrays that exceed spr.bin.
const badOffset = new Uint8Array(12);
putU32(badOffset, 0, 100000);
putU32(badOffset, 4, 5);
putU16(badOffset, 8, 1);
assert.throws(() => parseSprAnimationPack(badOffset, new Uint8Array(4)), /offset is outside/);
const shortHeaderIndex = new Uint8Array(12);
putU32(shortHeaderIndex, 0, 100000);
putU16(shortHeaderIndex, 8, 1);
assert.throws(() => parseSprAnimationPack(shortHeaderIndex, new Uint8Array(11)), /headers exceed/);
const truncatedFrames = encodePack([{ sprNo: 100000, animations: [makeAnimation(1)] }]);
putU32(truncatedFrames.sprBytes, 8, 2);
assert.throws(() => parseSprAnimationPack(truncatedFrames.indexBytes, truncatedFrames.sprBytes),
  /frame records exceed/);
assert.throws(() => parseSprAnimationPack(basic.indexBytes, basic.sprBytes, { nextMaxAdrnID: -1 }),
  /unsigned 32-bit integer/);

// A zero-frame animation stores a zero target duration.
const zeroFrames = encodePack([{ sprNo: 100002, animations: [makeAnimation(0, { dtAnim: 65535 })] }]);
const zeroParsed = parseSprAnimationPack(zeroFrames.indexBytes, zeroFrames.sprBytes);
assert.equal(zeroParsed.sprites[0].animations[0].dtAnim, 0);
assert.equal(zeroParsed.sprites[0].animations[0].frameCount, 0);

// Reproduce all four target post-load selectors without mutating source data.
const fixupInput = encodePack([
  { sprNo: 100820, animations: Array.from({ length: 55 }, (_, i) => makeAnimation(2, { soundNo: 30 + i })) },
  { sprNo: 100382, animations: Array.from({ length: 50 }, (_, i) => makeAnimation(1, { firstBmpNo: 100 + i })) },
  { sprNo: 100260, animations: Array.from({ length: 22 }, (_, i) => makeAnimation(6, { soundNo: 40 + i })) },
  { sprNo: 100381, animations: [makeAnimation(10, { dtAnim: 640, firstBmpNo: 800, soundNo: 20 })] },
  { sprNo: 100373, animations: Array.from({ length: 50 }, (_, i) => makeAnimation(16, { soundNo: 50 + i })) },
]);
const rawFixups = parseSprAnimationPack(fixupInput.indexBytes, fixupInput.sprBytes, { nextMaxAdrnID: 1000 });
const rawSound = rawFixups.sprites.find((sprite) => sprite.slot === 260).animations[21].frames[5].soundNo;
const corrected = applyTargetSpritePostLoadFixups(rawFixups.sprites);
const sprite = (slot) => corrected.sprites.find((item) => item.slot === slot);
assert.equal(rawSound, 66);
assert.equal(sprite(260).animations[21].frames[5].soundNo, 10001);
assert.equal(sprite(373).animations[49].frames[8].soundNo, 254);
assert.equal(sprite(373).animations[49].frames[10].soundNo, 254);
assert.equal(sprite(373).animations[49].frames[15].soundNo, 250);
assert.equal(sprite(382).animations[0].frameCount, 14);
assert.equal(sprite(382).animations[0].dtAnim, 4);
assert.deepEqual(sprite(382).animations[0].frames.map((frame) => frame.bmpNo),
  Array.from({ length: 14 }, (_, i) => 1101 + i));
assert.equal(sprite(382).animations[0].frames[4].soundNo, 24);
assert.equal(sprite(382).animations[0].frames[9].soundNo, 29);
assert.equal(sprite(820).animations[54].frames.every((frame) => frame.soundNo === 0), true);
assert.equal(rawFixups.sprites.find((item) => item.slot === 260).animations[21].frames[5].soundNo, rawSound);
assert.deepEqual(corrected.appliedFixups.map((item) => item.slot), [260, 373, 382, 820]);
assert.throws(() => applyTargetSpritePostLoadFixups([
  rawFixups.sprites.find((item) => item.slot === 382),
]), /requires source sprite slot 381/);

console.log('SPR/SPRADRN parser, bounds, duration, and target post-load fixup tests passed');
