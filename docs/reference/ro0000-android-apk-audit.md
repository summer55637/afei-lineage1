# RO0000 Android Client APK: Static and Native ELF Audit

更新日期：2026-10-03

## Identity

| 欄位 | 稽核結果 |
|---|---|
| File | `ro0000/client/android/冰河石器-隐盟.apk` |
| Provenance | VM 一鍵端 |
| Size | 24,931,847 bytes |
| Git blob SHA | `eaeb7c513ca0731c4bdeedd0987081b4bf443031` |
| SHA-256 | `6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c` |
| ZIP integrity | CRC pass, 38 entries |
| Package | `com.newssa.stoneage.ko` |
| Version | code 1, name 1.0 |
| SDK | min 21, target 29 |

## Archive and binary indicators

- One `classes.dex` (1,453,136 uncompressed bytes).
- Native libraries for `armeabi-v7a` and `x86`, including `libStoneage.so`, SDL2, SDL2_image, SDL2_mixer, SDL2_ttf, GCloudVoice, hidapi and mpg123.
- Visible packaged assets are two fonts and seven `assets/data/skin` PNG files.
- Archive path scan found no obvious map/tile/world/field/NPC/monster/battle filename entries.
- String scan of `classes.dex` and both `libStoneage.so` variants found client path references including `path/map4/real.bin`, `s/real.bin`, `s/adrn.bin`, `s/spr.bin`, `s/spradrn.bin`, `data/serverdata.dat` and `data/update/list.dat`.

These native strings are path references, not proof that the referenced files are packaged in this APK or downloaded at runtime. The data may exist in a separately installed directory or be handled through another resource layer.

## Update / external resource pipeline (2026-10-02)

The x86 native build now provides direct machine-code evidence that the APK has an HTTP patch/resource update pipeline; these are no longer only string-path hypotheses.

### Verified update-list flow

- `DownLoadIniFile()` obtains the installed app version, platform and channel, builds a request to the embedded `SA25/update/list.php` endpoint with `version`, `platform` and `channel` parameters, and calls `HttpClient::DownloadFile`.
- The returned update list is stored as `data/update/list.dat`.
- The native code contains `CIniManage::ReadPatchInfo()`, which parses an INI-style patch catalogue with sections named `Patch_%d`.
- Verified patch fields used by the parser are `FileName`, `FileSave`, `MD5`, `URLCN`, `type`, `size`, plus the platform selector `common`.

### Verified patch/resource application

- `GetBinaryResource()` has a download phase that generates `patch_%d.zip` names and passes them to `DownloadResource()`; the native path iterates through six patch slots in the inspected state machine.
- The corresponding resource phase opens each `patch_%d.zip` with `UnZipFile()`; a failed extraction causes the client to close the application, while successful extraction proceeds to the resource-completion state.
- `DownloadResource(const char*)` directly constructs/uses an `HttpClient` and calls its `DownloadFile` implementation, establishing that the patch/resource path performs actual HTTP file transfer rather than merely referencing filenames.
- The native binary also contains additional resource roots including `data/chardata`, `data/voice`, `data/aiset`, `data/font`, `data/skin` and `data/storage.bin`, indicating that the update layer is broader than the map/sprite files alone.

### Client update path

A separate `UpdateAppNewVersion()` path obtains version/platform/channel and posts to the embedded `SA25/clientupdate.php` endpoint. Its response branching, confirmation gate, APK download, basename-derived local path, and transition to Android-native installation are documented in `ro0000-android-apk-client-update-install-audit.md`. The server response schema and exact basename edge cases remain unresolved.

### Current evidence status

The client-side update/resource mechanism is now documented through its verified patch-list parser, `stPatchNode` field mapping, platform/`common` selector, local MD5 equality gate, six-slot `patch_%d.zip` download/extraction loop, ZIP removal, and failure transition in `ro0000-android-apk-patch-parser-audit.md`. The actual update-list and patch payload bytes remain unavailable, so end-to-end content validation is still open.

The embedded host/address is intentionally omitted from this public audit; the technical path and request parameter semantics are retained.

## Native ELF findings

The APK contains two `libStoneage.so` builds. Both passed ELF parsing and ABI/machine consistency checks.

| ABI | ELF | Build ID | SHA-256 |
|---|---|---|---|
| `armeabi-v7a` | ELF32, little-endian, ARM | `1b19ccce43386ffaf5371727161330e17b5105c4` | `4826c368a6791e680fc0e366e7af1c054454d2c5ead2ca831e2cd98838ecaa4d` |
| `x86` | ELF32, little-endian, i386 | `ab97d1ad35dd9296d54ef8d8c6639511db606333` | `7c521d9245e2d1668a758402b6975009fd30a7b7b41857d32fc4b51300a29f3d` |

### Resource and index loading

Static disassembly of both ABIs confirms the following call chain:

1. `LoadSprbin(char const*)` formats four path strings using `sprintf`.
2. It passes two of those paths to `AdrnInit(char*, char*)`.
3. When `AdrnInit` succeeds, `LoadSprbin` calls `InitSprBinFileOpen(char*, char*)` with the other path pair.
4. `AdrnInit` opens the two supplied files. For the first file it reads a four-byte value and compares it with `0x31393839`; on the matching branch it reads the remaining `fileSize - 4` bytes and passes that buffer to `adrnDecode`.
5. `adrnDecode` calls `setBlowFishKey` followed by `fish_decode`. The returned decoded length is then divided by `0x50` (80), and the resulting records are copied with an 80-byte stride.

The four `sprintf` templates were mapped against the x86 ELF string addresses and argument setup; the ARM build confirms the same call sequence:

| Call | Argument | Exact template |
|---|---|---|
| `AdrnInit` | 1 | `%s/adrn.bin` |
| `AdrnInit` | 2 | `%s/real.bin` |
| `InitSprBinFileOpen` | 1 | `%s/spr.bin` |
| `InitSprBinFileOpen` | 2 | `%s/spradrn.bin` |

`InitSprBinFileOpen` opens both sprite files and reads a 12-byte header from its second argument (`spradrn.bin`); it then uses indexed records and seeks/reads against the first argument (`spr.bin`). This confirms distinct sprite payload and index inputs, though the full on-disk record semantics are not yet reconstructed.

The separate literal `path/map4/real.bin` is passed to `LoadStoneAgeLUA` from an `InitGame` startup branch. The x86 disassembly establishes this record-reading sequence (also checked against the ARM build):

1. Read a 4-byte word and XOR it with `0x87091272` to obtain a payload length.
2. Read that many payload bytes into a buffer.
3. Read another 4-byte word and XOR it with the same constant to obtain a name-word count.
4. Read that many 4-byte name words, XOR each word, and append a terminating NUL byte.
5. Test the decoded name for the substring `.lua`. If present, call `myluaload(payload, name, payload_length)`; otherwise free the buffers and continue to the next record.

`myluaload(char*, char*, int)` passes the payload, name, and length into `luaL_loadbuffer`, then calls `lua_pcall`. Thus `path/map4/real.bin` is consumed as a named-entry Lua loading container, not as a directly parsed tile array in this code path. The APK does not include the referenced file, so its actual entries and any nested data remain unverified.

A second, separate loader `LoadStoneAgeLUAPath` opens a directory, skips dot-prefixed entries, loads regular files whose names end in `.lua`, and recursively calls itself for non-regular entries. This confirms that the client also supports loose Lua files in a directory tree; it is not the same mechanism as the `real.bin` record loader.

### Resource-boundary clarification: `path/map4/real.bin`

The `path/map4/real.bin` literal must not be conflated with the `%s/real.bin` asset shard opened by `AdrnInit()`. Target x86/ARM control flow shows the former is consumed by the `LoadStoneAgeLUA` record loader: a 4-byte XOR-decoded payload length is read, the payload is buffered, a second XOR-decoded 4-byte count determines the number of name words, each name word is XOR-decoded, and entries whose decoded name contains `.lua` are passed to `myluaload(payload, name, payloadLength)`. `myluaload` loads the buffer with `luaL_loadbuffer` and executes it with `lua_pcall`.

Therefore, at the current evidence level:

- `path/map4/real.bin` = named-entry Lua loading container;
- `%s/real.bin` = per-directory Real image payload paired with `%s/adrn.bin`;
- these are distinct resource classes despite sharing the filename suffix `real.bin`.

The actual `path/map4/real.bin` bytes, decoded entry names, and Lua payloads remain unavailable and are not substituted from public source. The machine-readable contract is `data/generated/stoneage_ro0000_android_lua_container_contract.json`.

### Decoded 80-byte record: fields verified by accessors

The following are offsets in the decoded record, not offsets in the APK or an independently verified on-disk file format.

| Accessor | Observed record offset | Observed operation |
|---|---:|---|
| `realGetPos` | 12, 16 | Reads two 32-bit values and writes them through two `short*` outputs |
| `realGetWH` | 20, 24 | Reads two 32-bit values and writes them through two `short*` outputs |
| `realGetHitPoints` | 28, 29 | Reads two bytes and writes them through `short*` outputs; the symbol name alone does not establish these bytes as health points |
| `realGetHitFlag` | 30 | Reads a 16-bit value and, on the ordinary path, returns its remainder after division by 100; there are special ID branches |
| `realGetPrioType` | 30 | Reads the same 16-bit value and returns its integer quotient after division by 100 |
| `realGetHeightFlag` | 32 | Reads a 16-bit value |
| `realGetSoundEffect` | 64 | Reads a signed 16-bit value |
| `realGetWalkSoundEffect` | 66 | Reads a signed 16-bit value |

These findings establish part of the decoded record layout and the accessor behavior. They do not establish the meaning of unobserved bytes or prove that the decoded record itself is a map tile.

### Additional accessor closure: verified ADRNBIN fields

Target x86 accessors map the following fields in the decoded 80-byte record. The position/dimension accessors read 32-bit values but expose their low 16 bits through `short*`; the two hit-extent fields are bytes and are zero-extended.

| Record offset | Stored type | Target accessor | Verified operation |
|---:|---|---|---|
| 0x0C | u32 | `realGetPos` | first position output, truncated to i16 |
| 0x10 | u32 | `realGetPos` | second position output, truncated to i16 |
| 0x14 | u32 | `realGetWH` | first dimension output, truncated to i16 |
| 0x18 | u32 | `realGetWH` | second dimension output, truncated to i16 |
| 0x1C | u8 | `realGetHitPoints` | first occupancy/hit-extent output, zero-extended |
| 0x1D | u8 | `realGetHitPoints` | second occupancy/hit-extent output, zero-extended |
| 0x1E | u16 | `realGetHitFlag`, `realGetPrioType` | ordinary IDs: `value % 100` is the hit-flag result; `value / 100` is the priority result |
| 0x20 | u16 | `realGetHeightFlag` | direct 16-bit read |
| 0x40 | i16 | `realGetSoundEffect` | signed sound/effect value, after image-ID to graphic-number lookup |
| 0x42 | i16 | `realGetWalkSoundEffect` | tested as nonzero; accessor returns a boolean, not the stored number |

`realGetHitFlag` forces its output to 1 for image IDs 369641–369654, 369715–369847, and 369941. These are target-specific numeric exceptions; the binary alone does not establish what each image depicts.

These accessor bounds are also explicit: the graphic-number accessors reject IDs at or above 600,000, while image-number lookups reject IDs at or above 100,000. Rejected output-pointer accessors write zero values and return false; the sound accessors return zero/false on their respective rejected paths.

This closes the listed accessor-visible fields, **not every target-side semantic use of the complete 80-byte record**. The separate loader and image path establish additional fields; a pinned public structure offers names for the remaining regions. See the structural cross-check below and the machine-readable summary in `data/generated/stoneage_ro0000_android_native_resource_layout.json`.

### ADRNBIN structural field map: target evidence and cross-source candidates

The target's 80-byte record can now be accounted for structurally without treating all member meanings as target-verified:

- The target uses a 0x50-byte record stride. `AdrnInit()` adjusts the leading u32 by the shard graphic-ID base; `realGetImage()` uses the u32 at +0x04 as the RealBin seek offset and the u32 at +0x08 as the payload byte count.
- The target accessors directly establish the +0x0C through +0x20 position, dimension, hit-extent and hit/height fields, and +0x40/+0x42 effect values.
- `AdrnInit()` uses the u32 at +0x4C as the nonzero image-number value for populating `bitmapnumbertable` when it is below 100,000.
- The pinned public [`loadrealbin.h` structure](https://github.com/alrightlook/StoneAgeMobileApp/blob/8c870c87ce1305c52fb6713bf824619467847bba/android-project/jni/src/systeminc/loadrealbin.h) independently defines an 80-byte `ADRNBIN` with a `MAP_ATTR` beginning at +0x1C. Its member offsets align with the target-confirmed accessor anchors above. This is cross-source structural corroboration; the exact source lineage/version of the target APK is not established.

| Offset | Public structure member candidate | Evidence boundary |
|---:|---|---|
| 0x00 | `bitmapno` | Target confirms shard-base adjustment and use as graphic-number slot |
| 0x04 | `adder` | Target confirms seek-offset use in `realGetImage` |
| 0x08 | `size` | Target confirms payload byte-count use in `realGetImage` |
| 0x0C, 0x10 | `xoffset`, `yoffset` | Target accessors confirm 32-bit loads exposed as low 16 bits |
| 0x14, 0x18 | `width`, `height` | Target accessors confirm 32-bit loads exposed as low 16 bits |
| 0x1C, 0x1D | `attr.atari_x`, `attr.atari_y` | Target confirms byte reads for the two hit-extent outputs; names are cross-source |
| 0x1E, 0x20 | `attr.hit`, `attr.height` | Target accessor and initialization behavior directly confirmed |
| 0x22–0x3E | `attr.broken`, `indamage`, `outdamage`, `inpoison`, `innumb`, `inquiet`, `instone`, `indark`, `inconfuse`, `outpoison`, `outnumb`, `outquiet`, `outstone`, `outdark`, `outconfuse` | Member names and 16-bit spacing are source-layout candidates only; target consumers and gameplay effects remain unverified |
| 0x40, 0x42 | `attr.effect1`, `attr.effect2` | Target confirms signed 16-bit sound/effect reads; names are cross-source |
| 0x44, 0x46, 0x48 | `attr.damy_a`, `attr.damy_b`, `attr.damy_c` | Unsigned 16-bit source-layout candidates; target consumers remain unverified |
| 0x4A–0x4B | alignment padding before `attr.bmpnumber` | Implied by the pinned public C structure's 4-byte member alignment; not a target semantic field |
| 0x4C | `attr.bmpnumber` | Target confirms use in the image-number-to-graphic-number table mapping |

Thus the record's storage skeleton is mapped across all 80 bytes by target anchors plus a pinned cross-source layout. The remaining open issue is not byte placement but target-side meaning/use for the +0x22–0x3E status/damage members and +0x44–0x48 `damy` members. No effect is inferred from the member names alone.

### Auto-map color generation and cache

The target now has a separate static contract for auto-map color preparation. `initAutoMapColor()` first attempts to read its existing cache; when the read fails, it calls `makeAutoMapColor()` and then `writeAutoMapColor()`. The cache payload is a 2-byte zero header followed by 100,000 one-byte entries (100,002 bytes total when written). The reader requires the header to equal zero and reads one complete 100,000-byte item; it does not check an end-of-file condition or a build fingerprint. The writer does not test the returned item counts from `fwrite`, so its success return indicates that the file was opened and the write/close path was attempted, not that the full payload was durably persisted.

`makeAutoMapColor()` iterates 600,000 records at an 80-byte stride. It uses the record's `bmpnumber` at +0x4C as the color-table index, while ordinary image-color generation passes the record's leading `bitmapno` (+0x00) to `getAutoMapColor()`. Values at or above 100,000 are outside the byte-table domain and are skipped. For in-domain entries, the target:
- invokes image-derived color calculation for `bmpnumber` 100–19,999, 34,101–34,999, and 35,346–36,928;
- uses a built-in 20-entry mapping for 60–79, storing each entry's low byte;
- writes zero for other in-domain IDs, including zero.

The image-derived path calls `realGetImage(bitmapno,...)`. On success, it traverses the image pixels, excludes palette index zero, sums the first three bytes of the selected 4-byte palette entries, and takes integer averages over nonzero pixels. If no such pixels exist, the result is zero. Otherwise the three averaged bytes are packed into bits 0–7, 8–15, and 16–23 and passed to `getNearestColorIndex(..., 256)`. The nearest-color routine compares the first three color bytes by sum of squared differences; palette entry 0 seeds the result, and entries 16–239 are scanned as alternatives. The alpha byte is not part of this distance.

The inline mapping for IDs 60–79 resolves to the following one-byte results: `[104, 0, 40, 0, 176, 0, 8, 0, 136, 0, 72, 0, 240, 80, 4, 0, 84, 0, 20, 85]`. The x86 and ARMv7 binaries contain the same 80-byte source table, and the target code stores its low byte as the color-table value.

These rules close the auto-map color index/generation and cache format at the code level. They do not reproduce the final 100,000-byte table without the external image payloads, and the actual visual effect still requires those payloads or an original-client runtime comparison. The machine-readable fields are in `data/generated/stoneage_ro0000_android_native_resource_layout.json` under `autoMapColor`.

### Auto-map composition and SDL rasterization

The target's auto-map is a two-stage path: `drawAutoMap(x,y)` calls `createAutoMap(nowFloor,nowGx,nowGy)` when the initialization flag is set, clears that flag after the attempt, and then passes the 54×54 byte buffer to `DrawAutoMapping(x,y,buffer,54,54)`. A failed cache open leaves the buffer zeroed; the draw wrapper does not use the boolean return to retry on the next call.

`createAutoMap()` centers a 54×54 window on the current grid position, starting at `(gx-27,gy-27)`. It clips that rectangle against the dimensions in the local map-cache header and places clipped rows/columns at the corresponding offset in zero-initialized staging buffers. It reads the cache's three uint16 planes in their established order: `tile`, `parts`, and `event`. Only cells with `event & 0x4000` set contribute visible color.

Composition occurs in two passes:

1. The base pass writes `autoMapColorTbl[tile]` for in-range tile IDs (below 100,000). This produces the terrain/base color layer.
2. The parts pass looks up `autoMapColorTbl[parts]`; zero means no overlay. For a nonzero color, it resolves the parts ID with `realGetNo` and queries `realGetHitFlag`. A nonzero hit flag paints the current cell. A zero hit flag obtains `hitX/hitY` and paints the footprint at rows `i-k`, columns `j+l` for `k < hitY` and `l < hitX`, bounded by the top and right edges of the 54×54 output. Since this pass follows the base pass, parts colors can overwrite terrain colors.

The drawing function locks the target `CSASurface`, reads each byte as an index into `highColor32Palette`, forces the high alpha byte to `0xff`, and writes four 32-bit pixels per logical cell at `p-4`, `p`, `p+4`, and `p-surfacePitch`. The pointer advances diagonally between cells and rows (`-(surfacePitch-8)` across a row and `surfacePitch+8` to the next row), producing the target's slanted map projection rather than a rectangular 1:1 tile grid. After a successful unlock, the surface texture is submitted with `SDL_RenderCopy`.

Both packaged target ABIs pass x/y and w/h directly to the raster path, use fixed origin offsets (18,118), and sample the source buffer with a stride of one. Neither target `DrawAutoMapping` implementation shows a `ResoMode`-specific dimension or coordinate scaling branch. The player marker is a separate four-pixel glyph using palette index 0 or 255; its value toggles on a 1,000 ms tick interval and its position is calculated from the rendered dimensions. A `ResoMode == 1` halving branch with offsets 10/58 and stride-two sampling exists in the pinned public `directdraw.cpp` reference, but is not present in the target APK and is kept as cross-source context only.

This closes the target's auto-map composition and raster contract at the instruction/data-flow level. It does not produce the original image colors without the real map-cache and image resources, nor does it prove exact SDL output equivalence in a browser. The machine-readable details are in `data/generated/stoneage_ro0000_android_native_resource_layout.json` under `autoMapRendering`.

### ADRNBIN initialization corrections

Besides the accessor behavior above, `AdrnInit()` performs a post-decode rewrite of the 16-bit value at record offset `0x1E` for two image-ID ranges:

| Image ID range (inclusive) | Rewritten record field |
|---|---|
| `0x3202–0x320B` (12802–12811) | `u16[0x1E] = 300 + (oldValue % 100)` |
| `0x2794–0x2798` (10132–10136) | `u16[0x1E] = 300 + (oldValue % 100)` |

The rewrite preserves the original value's remainder modulo 100 while forcing its integer quotient by 100 to 3. The same selector ranges and rewrite are present in target x86 `AdrnInit()` and ARMv7 `AdrnInit()`, so this is an ABI-cross-checked target initialization correction rather than a legacy-source guess.

This is distinct from `realGetHitFlag()`'s special image-ID cases, which force the accessor output to 1 without changing the stored record. Neither path establishes the affected assets' visual identity or intended artistic meaning. The machine-readable contract is recorded under `adrn.initializationFixups` in `data/generated/stoneage_ro0000_android_native_resource_layout.json`.

### Cross-check against published legacy format notes

Third-party legacy-format notes independently describe 80-byte StoneAge Adrn records with 32-bit fields at offsets 0, 4, 8, 12, 16, 20 and 24, followed by east/south occupancy bytes at 28/29, a map-related flag at 30, an unknown region, and a map number near the end. The Android accessors' X/Y and width/height offsets match that description. This makes an Adrn-index interpretation of the decoded records plausible, but the notes are not authoritative for this APK.

There is an important mismatch: the legacy note describes offset 30 as a one-byte 0/1 flag, while the Android native accessors load a 16-bit value there and expose a quotient/remainder split by 100, with special-ID handling in the hit-flag accessor. Treat this as a version or encoding discrepancy until matching raw Android resource bytes can be inspected. In particular, do not call offsets 28/29 health values based on the native function name alone; the legacy notes identify these positions as occupancy dimensions.

The same legacy reference describes StoneAge map files as width/height followed by separate 16-bit ground, object, and map-flag arrays. That general map layout is not evidence that Android's `path/map4/real.bin` contains those arrays; `real.bin` is also used as an image-data resource in the documented legacy client formats.

References (community reverse-engineering material; comparison only):
- [StoneAge client BIN format analysis](https://1.shiqimod.cc/lishi/shiqi182bin.htm)
- [pioneers-g/StoneAgeClient](https://github.com/pioneers-g/StoneAgeClient) (separate legacy `real.bin`, `adrn.bin`, `spr.bin`, and `spradrn.bin` resource paths)

### Local map cache: `map/%d.dat`

The native `createMap`, `readMap`, and `writeMap` functions use the separate local path template `map/%d.dat`. The evidence establishes the following file layout for files created by `createMap`:

| Offset | Size | Stored data |
|---:|---:|---|
| 0 | 4 bytes | First dimension, copied from `createMap` argument 2 |
| 4 | 4 bytes | Second dimension, copied from `createMap` argument 3 |
| 8 | 2 × A × B bytes | `tile`: A × B sequential 16-bit cells |
| 8+2AB | 2AB bytes | `parts`: A × B sequential 16-bit cells |
| 8+4AB | 2AB bytes | `event`: A × B sequential 16-bit cells |

Here A and B denote the two stored dimensions in argument order; the x/y orientation is not established. The blank cache file produced by `createMap` is therefore 8+6AB bytes, assuming the writes complete successfully. All three planes are initialized with 16-bit zero values.

`readMap` opens the same path, reads the two 4-byte header values, and then performs three separate row-oriented reads into three `unsigned short*` output buffers. The plane bases advance by 2AB bytes each, matching the layout above. It also converts the header dimensions for float outputs by dividing them by two; the higher-level meaning of those float outputs is not established by this function alone.

`writeMap` opens the same path, reads the header dimensions, adjusts the requested rectangle, and performs three corresponding row-oriented writes at the existing plane offsets. The event-plane pass ORs `MAP_SEE_FLAG | MAP_READ_FLAG` into event values before writing; for cells inside the active map window it also updates event memory with `setEventMemory`. This confirms that the native code can read and update all three planes, rather than merely creating an empty file.

The `0xAB2`-byte clear size used for some map output buffers is 2,738 bytes, or 1,369 16-bit cells. This is a fixed output/window buffer size in the inspected code and must not be treated as the full map dimensions.

This identifies a native local map-cache format with a header and three planar cell arrays. A closely matching public Android client implementation gives these arrays the names `tile`, `parts`, and `event`, and uses the same `createMap` / `readMap` / `writeMap` API shape. The target APK's native `M_recv` call path independently confirms that three buffers are passed to `writeMap` in the same order. The exact source lineage and version identity between that public source and this APK are not established, so the names are cross-source corroboration rather than proof of byte-for-byte source identity. In particular, this `map/%d.dat` cache is separate from the `path/map4/real.bin` Lua loading container and from the server's Fixed-C LS2MAP format.


A public Android `netproc.cpp` implementation independently shows `lssproto_M_recv` decoding three comma-separated fields into `unsigned short tile[2048]`, `parts[2048]`, and `event[2048]`, then passing them to `writeMap` in that order. Its `lssproto_S_recv` case `C` reads floor, map dimensions, and origin coordinates before calling `setMap` and `createMap`. This is consistent with the native target's call-site analysis.

The pinned Fixed-C server source explains the matching wire payload: `lssproto_M_recv` asks `MAP_getdataFromRECT` for a clipped rectangle and sends the returned map data. `MAP_getdataFromRECT` serializes the server's `MAP_map.tile` array first, then `MAP_map.obj`, then a third per-cell event array built by scanning map objects for character/warp-point event types (using `CHAR_EVENT_NONE` when no event is present). Thus the client `tile` plane corresponds to server `tile`; client `parts` corresponds to server `obj`; and client `event` receives the dynamic per-cell event value. The Android `writeMap` path additionally ORs `MAP_SEE_FLAG | MAP_READ_FLAG` into its local event plane before persisting it, so the local event cache combines received event data with client-side visibility/read state.

This server/client correspondence identifies the three planes' primary roles, but does not make the local cache a source of original map geometry: the cache is populated in rectangles from the server, and its event plane includes client-side state. It also does not imply that server Fixed-C LS2MAP binary files and Android `map/%d.dat` files share a file format.

Source comparisons (cross-check only):
- [Android map.cpp](https://github.com/alrightlook/StoneAgeMobileApp/blob/8c870c87ce1305c52fb6713bf824619467847bba/android-project/jni/src/system/map.cpp)
- [Android netproc.cpp](https://github.com/alrightlook/StoneAgeMobileApp/blob/8c870c87ce1305c52fb6713bf824619467847bba/android-project/jni/src/system/netproc.cpp)
- [Pinned Fixed-C callfromcli.c](https://github.com/gavinlinasd/StoneAge/blob/1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56/gmsv/src/callfromcli.c)
- [Pinned Fixed-C readmap.c](https://github.com/gavinlinasd/StoneAge/blob/1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56/gmsv/src/map/readmap.c)
- [Pinned Fixed-C map structure](https://github.com/gavinlinasd/StoneAge/blob/1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56/gmsv/src/include/readmap.h)

### Derived HitMap and movement collision

The target APK's native \`readHitMap\` builds a separate 16-bit \`hitMap\` from the current \`tile\`, \`parts\`, and \`event\` window. Its output is cleared first; the fixed 2,738-byte clear corresponds to 37 × 37 16-bit cells in this client configuration.

- Tile and parts values above \`CG_INVISIBLE\` (99), plus the special 60–79 range, are resolved through \`realGetNo\` and \`realGetHitFlag\`.
- For hit flag 0, the client uses \`realGetHitPoints\` to mark the sprite footprint as state 1, without overwriting cells already at state 2.
- For hit flag 2, the footprint is marked state 2.
- Certain ordinary tile/parts codes are handled directly: 1, 2, 5, 6, 9, and 10 mark state 1; code 4 marks state 2. Tile code 0 is treated as blocked only when the event plane has \`MAP_SEE_FLAG\` set.
- Parts IDs 15680–15732 with hit flag 1 mark only their anchor cell as state 1.
- If the low 12 bits of an event cell equal \`EVENT_NPC\`, that cell is marked state 1.

The target \`checkHitMap\` returns false immediately for \`pc.skywalker\`; otherwise coordinates outside the active map window return true. Inside the window it returns true only when the derived \`hitMap\` cell equals 1. Therefore state 1 is the movement-blocking result; state 2 is a distinct derived state that this query does not treat as blocked. Do not interpret the values 1/2 as raw map tile IDs or copy this client-side algorithm into the server Fixed-C runtime without separate verification.

### Map-cache call sites

- `lssproto_S_recv` parses incoming fields, calls `setMap`, and then calls `createMap` with the map identifier and two dimension values.
- `lssproto_M_recv` parses incoming fields into three 16-bit cell buffers and calls `writeMap` to update the local cache. Its surrounding path may trigger `redrawMap` after the update.
- `ddrawBattleMap`, `drawMap`, and `drawTile` call `readMap`, showing that the same local cache is consumed by battle-map and ordinary drawing paths.

These call sites support describing `map/%d.dat` as a client-side map cache initialized and updated through protocol receive handlers and read by drawing code. They do not, by themselves, establish the precise semantics of the three planes or prove that the incoming values align one-to-one with the server's Fixed-C map data.
### Hit-map runtime

- The native global symbol `hitMap` is 2,738 bytes in both builds. That size equals 1,369 16-bit cells, or 37 × 37 cells; the dimensions are inferred from the symbol size, not from a named width/height field.
- `readHitMap` iterates a requested rectangle, reads 16-bit map values using a row/width-based index, calls `realGetNo` and `realGetHitFlag`, and writes 16-bit result values including 1 and 2.
- `checkHitMap` converts the queried coordinates relative to map origins. It returns true for out-of-bounds coordinates; for in-bounds coordinates it reads a 16-bit cell and tests whether it equals 1.

This confirms that the native client has a distinct HitMap construction/query path and that cell value 1 is treated as a hit by `checkHitMap`. It does not prove that this value is interchangeable with the server's map tile IDs or Fixed-C walkability rules.

## Target map prefetch and map-buffer contract

The target x86 ELF directly exposes the full map-area prefetch path:

| Function | Address | Meaning |
|---|---:|---|
| `checkEmptyMapData(int,int,int)` | `0x219c50` | Detect an unread edge in the next movement direction and prepare bounded map requests |
| `_checkEmptyMap()` | `0x218810` | Send each prepared rectangle through `lssproto_M_send` and record the pending edge/time state |
| `checkEmptyMap(int)` | `0x213360` | Related map-empty state/timing path |

The target requires both cached map-window dimensions to be at least 37 cells before it checks for an unloaded edge. It uses `SEARCH_AREA=11`, so each exposed edge scan checks up to 23 cells. An edge cell is considered not yet read when its event-plane `MAP_READ_FLAG` bit (`0x8000`) is clear; world-floor bounds are checked before the cache access.

| Direction | Coordinate delta | Edges checked |
|---:|---:|---|
| 0 | (-1,+1) | left + bottom |
| 1 | (-1,0) | left |
| 2 | (-1,-1) | left + top |
| 3 | (0,-1) | top |
| 4 | (+1,-1) | top + right |
| 5 | (+1,0) | right |
| 6 | (+1,+1) | right + bottom |
| 7 | (0,+1) | bottom |

These directions match the target's eight-entry movement delta table. For each selected edge, the function stops at the first in-bounds event cell whose `MAP_READ_FLAG` is clear, prepares a request rectangle, passes it through `checkAreaLimit`, and increments the pending rectangle count. Cardinal directions can produce one rectangle; diagonal directions can produce up to two. `_checkEmptyMap()` sends the resulting rectangle(s) using the map protocol and records the direction, current grid location, and start time for the pending map-empty state.

This closes the map-edge prefetch decision and its protocol handoff. It is a cache streaming mechanism, not a walkability test; walkability remains in the separate `readHitMap` / `checkHitMap` path. The generated browser/runtime map must not fabricate a successful read flag when no map response was observed.

### HitMap input/output roles

The target `readHitMap` ABI is `readHitMap(x1,y1,x2,y2,tile,parts,event,hitMap)`. The first three 16-bit buffers are input planes from the active map cache; the fourth is a derived 16-bit output plane. The function clears 2,738 bytes (1,369 uint16 cells, or 37×37) in the output before processing the requested rectangle. It uses the tile and parts image IDs, their resolved hit flags/footprints, direct tile-code cases, and the event plane's visibility/NPC bits to write derived states. `checkHitMap` then queries that derived plane; it does not query the original tile IDs directly.

The meaning of the output values is operational: `checkHitMap` reports a collision only for state 1 (except the explicit skywalker bypass); state 2 is retained as a different map state and is not treated as blocking by that function. See the battle-map audit's HitMap section for the documented image footprint and direct-code branches.

## Target route and movement flow

The target has a separate routing and coordinate-motion path. This contract is recorded in \`data/generated/stoneage_ro0000_android_map_movement_contract.json\`; addresses are build-specific.

- \`getRouteMap()\` calls \`getRouteData\`, \`checkHitMap\`, and \`getDirData\`, with \`Atan\`/\`AdjustDir\` used in direction calculations. This directly connects route planning to the derived HitMap query, while leaving the server's final movement acceptance outside the client evidence.
- \`setMapMovePoint(int,int)\` and \`_setMapMovePoint(int,int)\` store the target values, scale them by 64 in the internal floating-point coordinate frame, calculate displacement, normalize a non-zero vector, derive direction through \`Atan\`/\`AdjustDir\`, and call \`setPcDir\`, \`setPcWalkFlag\`, and \`setPcPoint\`.
- \`_mapMove()\` and \`mapMove2()\` update floating-point position using a movement increment and clamp at the destination when the remaining displacement is reached. The active movement path sets action value 4 and the PC walk flag. The completion path uses action value 3, clears the walk flag, and records \`SDL_GetTicks()+500\`.
- \`_partyMapMove()\` iterates action records and calls \`charMove2\` for records passing the observed \`0x100\` flag check.

These findings separate three client concerns: route planning consults HitMap, map-edge prefetch requests unread data, and movement routines advance coordinates and animation/action state. They do not prove the server's walkability rules, network acceptance, or persistent coordinates. Browser movement should keep those as separate contracts rather than using cache-read state as collision state.

## Target SPRADRN / SPR record fields

The target x86 `InitSprBinFileOpen()` at `0x3637e0` reads a 12-byte index record from `spradrn.bin`, subtracts 100,000 from `sprNo` to obtain the SpriteData slot, stores `animSize`, and seeks to the record's `offset` in `spr.bin`.

The target reads each animation header as 12 bytes and each frame record as 10 bytes:

| Record | Offset | Size | Field | Target interpretation |
|---|---:|---:|---|---|
| SPRADRN | 0x00 | 4 | `sprNo` | Sprite identifier; target subtracts 100,000 for the table slot |
| SPRADRN | 0x04 | 4 | `offset` | Byte offset into `spr.bin` |
| SPRADRN | 0x08 | 2 | `animSize` | Number of animation headers |
| SPRADRN | 0x0a | 2 | ABI padding | Read as part of the 12-byte record; no semantic use established |
| ANIM_HEADER | 0x00 | 2 | `dir` | Direction code |
| ANIM_HEADER | 0x02 | 2 | `no` | Action/category code |
| ANIM_HEADER | 0x04 | 4 | `dtAnim` | Animation duration input |
| ANIM_HEADER | 0x08 | 4 | `frameCnt` | Number of frame records |
| FRAMELIST | 0x00 | 4 | `BmpNo` | Image number; target adds `nextMaxAdrnID` |
| FRAMELIST | 0x04 | 2 | `PosX` | Signed horizontal frame offset |
| FRAMELIST | 0x06 | 2 | `PosY` | Signed vertical frame offset |
| FRAMELIST | 0x08 | 2 | `SoundNo` | Sound/effect cue identifier |

For `frameCnt == 0`, the target sets the stored per-frame animation duration to zero. Otherwise it computes `dtAnim / frameCnt / 16` before storing the per-animation timing value. It allocates `frameCnt` frame records and reads them sequentially. The sprite table remains separate from the SABEX cell array, while frame `BmpNo` values share the global graphic-number namespace used by ADRNBIN/Real.

The target compares the derived slot against 40,000 before continuing. Because the table allocation is 40,000 entries, the inclusive boundary deserves a separate runtime/input validation; this static audit does not claim malformed `sprNo=140000` input is safe. The function also contains target-specific post-load correction branches, so historical public-source fixups must not be copied into the target contract unless independently confirmed against this ELF.


### Target sprite post-load fixups

The target x86 and ARMv7 `InitSprBinFileOpen()` implementations contain four explicit post-load correction selectors, based on `spriteSlot = sprNo - 100000`. The branch set and mutations agree across both ABIs:

| Sprite number | Slot | Target mutation |
|---:|---:|---|
| 100260 | 260 (0x104) | Animation index 21, frame 5: set `SoundNo = 10001 (0x2711)`. |
| 100373 | 373 (0x175) | For animation indices `7*i`, `i=0..7`, set frame 8 and 10 `SoundNo=254 (0x00fe)`, and frame 15 `SoundNo=250 (0x00fa)`. |
| 100382 | 382 (0x17e) | For animation indices `7*i`, `i=0..7`, rebuild each action as a 14-frame sequence. The new list is `calloc(14,12)`; its `BmpNo` values are 14 consecutive IDs starting at the prior first frame ID + 1. Its `dtAnim` is copied from `SpriteData[381].animation[0]`, and the `SoundNo` cues at frame indices 4 and 9 are copied from that template animation. |
| 100820 | 820 (0x334) | For animation indices `7*i+5`, `i=0..7`, clear `SoundNo` on every frame. |

The file stores 10-byte frame payloads, while the loaded runtime frame list uses a 12-byte stride. The fixup offsets and pointer arithmetic confirm the runtime stride. These selectors close the four explicit special-case branches in this loader; they do not establish the intended artistic/audio purpose of each correction, nor do they rule out mutations in other functions. The machine-readable details are in `data/generated/stoneage_ro0000_android_native_resource_layout.json`.


## Browser-side SPR/SPRADRN parser and safe target fixups

`src/stoneage_spr_decoder.mjs` now parses the target's 12-byte SPRADRN index entries, 12-byte animation headers, and 10-byte on-disk frame records. It preserves the little-endian fields, applies the `nextMaxAdrnID` graphic-number base, and computes the target's stored frame duration (`frameCount == 0 ? 0 : sourceDtAnim / frameCount / 16`, with integer truncation). The 12-byte runtime frame stride remains distinct from the 10-byte file record.

The parser rejects partial index records, duplicate slots, offsets or frame arrays extending beyond `spr.bin`, and sprite IDs that fall outside the allocated 40,000-entry `SpriteData` table. The APK's observed native guard is `slot > 40000`, which admits `slot == 40000` even though valid table indices end at 39999. The reconstruction parser deliberately uses the safe half-open range `[0, 40000)`; this is a browser/reconstruction hardening rule, not a claim that the original binary was patched.

`applyTargetSpritePostLoadFixups()` separately reproduces the four documented target selectors (slots 260, 373, 382, and 820). It clones the parsed inventory, applies the frame/sound changes after the relevant sprite records are available, and fails closed when a selected record lacks the frames or source animation required by the target patch.

Only synthetic inputs are available for these tests. Passing the parser and fixup tests validates structure handling and the explicitly recorded transformations; it does not validate any real `spradrn.bin`/`spr.bin` payload, sprite pixels, or audiovisual effect. The existing client asset pack loader now accepts optional `files.spriteShards[]` entries, fetches and hash-checks each index/data pair, merges the parsed slots, applies the target corrections after merge, and exposes `resolveClientSpriteAnimation()`. `resolveClientSpriteFrameAsync()` now resolves a selected frame's global graphic number through the loaded ADRNBIN index and decodes its RD/gG bytes from Real, returning image pixels along with the separate frame and graphic offsets and sound cue. The existing ADRN/Real-only manifest remains compatible. The current repository still contains no real sprite payloads, so only synthetic fixtures exercise this path.

## Interpretation boundary and remaining work

The APK archive/Manifest, DEX structure, Java wrapper flow, signature verification result, and focused x86/ARM native ELF evidence are now reproducible. This remains a static audit, not a complete decompilation or runtime trace. Still unverified:

- The real-world publisher identity behind the embedded certificate fingerprint. Signature verification fails on all tested profiles because of a v1 entry digest mismatch; the APK is intentionally not re-signed.
- Runtime behavior of launcher/startup and updater scheduling; the invocation and side effects of the three extra exported Stoneage JNI callbacks; registration/loading behavior for eight package-associated JNI candidates and ten Bugly native declarations without packaged static matches; and device-specific permission/install behavior. The static APK-install call chain is documented, but actual Android intent behavior has not been exercised on a device.
- The actual `battleNNN.sabex`, `s/adrn.bin`, `s/real.bin`, `s/spr.bin`, `s/spradrn.bin`, and `path/map4/real.bin` payload bytes, including record instances and resulting real pixels.
- ADRNBIN accessor-visible fields at 0x0C–0x20 and 0x40–0x42 are documented; bytes 0x00–0x0B, 0x22–0x3F and 0x44–0x4F are not mapped by the inspected getter set. The four explicit `InitSprBinFileOpen` post-load fixup branches are enumerated, but their final visual/audio effects need real assets or runtime comparison.
- The actual update-list contents, patch ZIP payloads, and per-file metadata values for this installation. Parser field mapping, platform admission, local MD5 comparison, and the six-slot download/extraction path are documented separately; missing payloads prevent end-to-end reproduction.
- A live Android runtime trace and a frame/pixel comparison against the original SDL renderer, including character/NPC z-order and camera behavior.

Do not use this APK audit alone to rewrite server maps or the Fixed-C LS2MAP contract. Keep Android resource semantics separate until actual resource bytes and runtime evidence establish a mapping.

## Reproducibility

APK archive and Manifest audit:

```sh
python3 tools/audit_ro0000_android_apk.py \
  --apk 'ro0000/client/android/冰河石器-隐盟.apk' \
  --output artifacts/ro0000_android_apk_audit.json \
  --baseline data/generated/stoneage_ro0000_android_apk_audit.json
```

DEX structure inventory:

~~~sh
python3 tools/audit_ro0000_android_dex.py \
  --apk 'ro0000/client/android/冰河石器-隐盟.apk' \
  --output artifacts/ro0000_android_dex_audit.json
~~~

APK signature verification (read-only):

~~~sh
python3 tools/audit_ro0000_android_signing.py \
  --apk 'ro0000/client/android/冰河石器-隐盟.apk' \
  --output artifacts/ro0000_android_signing_audit.json
~~~

Native ELF inventory and focused disassembly:

```sh
python3 tools/audit_ro0000_android_native.py \
  --apk 'ro0000/client/android/冰河石器-隐盟.apk' \
  --output artifacts/ro0000_android_native_elf_audit.json \
  --extract-dir artifacts/native
```

CI runs both test suites, checks the archive/Manifest identity against the committed baseline, analyzes both embedded `libStoneage.so` files, and publishes the JSON reports plus extracted native libraries as a 30-day artifact. Latest successful native-disassembly run: https://github.com/summer55637/afei-lineage1/actions/runs/36996292512

### ADRN cryptographic contract (target x86)

Actual target x86 disassembly now closes the resource-index cipher path more precisely:

- `adrnDecode()` at `0x364970` passes a fixed 32-byte ASCII string from the native `.rodata` section to `setBlowFishKey()`.
- The literal key is intentionally not copied into the repository. Its SHA-256 fingerprint is `50d2411ac703d8e9ed1293eb0c885cac7102f45660c6d770a673ca9b4030e657`.
- `setBlowFishKey()` constructs an 18-word P-array and four 256-entry S-boxes.
- The table begins with the standard Blowfish P-array constants `0x243f6a88`, `0x85a308d3`, `0x13198a2e`, `0x03707344`, and the target F-function has the standard four-S-box addition/XOR/addition form.
- `fish_decode()` uses 8-byte blocks and reverses the Blowfish P-array order (`P[17]` downward), matching Blowfish decryption rather than the forward encryption order used by the companion `fish_encode()` path.
- `fish_decode()` processes the full 8-byte block portion in place. When a non-zero-length remainder exists, the first remainder byte is consumed as the target's trim/output-length marker; this exact behavior is preserved in the decoder tool rather than replaced with a guessed standard padding rule.
- `AdrnInit()` checks the first 4 bytes against the literal word `0x31393839`, decodes the remaining bytes through `adrnDecode()`, and then treats the returned decoded length as a sequence of 80-byte ADRNBIN records.

This means the target resource-index chain is now:

~~~text
target adrn.bin
  -> 4-byte magic word
  -> target Blowfish decode
  -> decoded 80-byte ADRNBIN records
  -> bitmap-number -> graphic-number index
  -> real.bin offsets/sizes
~~~

The actual `adrn.bin` and `real.bin` payload bytes are still absent, so decoded record contents remain an evidence gap. No target resource records are being fabricated.

## Target image/sprite resource layout closure

本輪從實體 target x86 ELF 再往下確認了 resource table 的實際容量與 shard 合併方式。

### Global table capacities

| Table | Bytes | Entry size | Entries | Role |
|---|---:|---:|---:|---|
| `bitmapnumbertable` | 400,000 | 4 | 100,000 | image/bmp number → graphic number |
| `adrnbuff` | 48,000,000 | 80 | 600,000 | graphic number → ADRNBIN |
| `Realbinfp` | 2,400,000 | 4 | 600,000 | graphic number → Real `FILE*` |
| `SpriteData` | 320,000 | 8 | 40,000 | sprite number → animation data |

The target `realGetNo()` accepts image IDs below 100,000. Since SABEX cells are uint16, the entire raw SABEX domain 0..65,535 is representable inside that image-ID domain.

`StockDispBuffer()` adds a separate render gate: `bmpNo <= 99` is rejected before `realGetNo()`, while values above 99 enter the image resolver path.

### Resource shard tree

`loadResources()` at `0x3647f0` calls `InitPteernSeparationBin("path", true)`. The latter recursively scans directories. `LoadSprbin()` constructs these per-directory resource paths:

~~~text
%s/adrn.bin
%s/real.bin
%s/spradrn.bin
%s/spr.bin
~~~

`AdrnInit()` copies the current `MaxAdrnID` into `nextMaxAdrnID` before importing a shard. Each decoded 80-byte ADRNBIN's `bitmapno` is offset by that base before entering `adrnbuff` and `Realbinfp`; non-zero `attr.bmpnumber` is entered into `bitmapnumbertable` against the shifted graphic number.

Thus the target resource tree is a set of shards merged into one global graphic-number namespace, rather than isolated per-directory graphic IDs.

### Sprite animation records

`InitSprBinFileOpen()` independently consumes `spradrn.bin` and `spr.bin`:

~~~text
spradrn entry = 12 bytes
  u32 sprNo
  u32 offset
  u16 animSize
  u16 ABI padding

spr.bin
  12-byte animation header
  10-byte frame payload
  ...
~~~

Each frame bitmap number is offset by the same `nextMaxAdrnID` base before being stored in `SpriteData`. This creates a shared graphic-number address space with ADRNBIN while keeping sprite animation metadata separate from SABEX tile storage.

The new machine-readable summary is `data/generated/stoneage_ro0000_android_native_resource_layout.json`.

### SABEX boundary

The target battle-map path is therefore now best represented as:

~~~text
battleNNN.sabex
  -> uint16 image/bmp ID
  -> StockDispBuffer render gate
  -> realGetNo()
  -> bitmapnumbertable[imageId]
  -> global graphicNo
  -> adrnbuff[graphicNo]
  -> Realbinfp[graphicNo]
  -> Real binary decoder
~~~

This closes the identifier and table topology, but not the actual target `adrn.bin` / `real.bin` / `.sabex` payload contents.

## Target Real-image decoder closure

Target x86 `decoder()` @ `0x2f5410` is now directly rechecked from the retrieved native ELF. It is the final decoder called by `realGetImage()`.

### RD container

First two bytes are interpreted as little-endian magic `0x4452`, i.e. `RD`. The target reads the following 16-byte header:

| Offset | Size | Meaning |
|---:|---:|---|
| `0x00` | 2 | `RD` magic |
| `0x02` | 1 | compression flag |
| `0x03` | 1 | reserved / unused by the observed decoder |
| `0x04` | 4 | width, little-endian |
| `0x08` | 4 | height, little-endian |
| `0x0c` | 4 | stored record size, little-endian |

Observed target branches:

1. `compression flag == 0`: copies `width * height` bytes directly from `+0x10`; output size is one byte per pixel.
2. `compression flag == 0x20`: allocates/declares `width * height * 4` output bytes and calls zlib `uncompress` on the payload from `+0x10` with source length `size - 0x10`. This is a four-byte-per-pixel path.
3. Any other non-zero compression flag enters the custom RLE decoder.

### Custom RLE

The target control byte uses the same bit assignments already represented in `src/stoneage_rd_decoder.mjs`:

~~~text
bit 7 (0x80) = repeat run
bit 6 (0x40) = repeat value is zero
bit 5 (0x20) = extended 3-byte repeat count
bit 4 (0x10) = extended 2-byte count
~~~

For repeat runs the target optionally reads one repeat-value byte, then forms the count from low four control bits plus either zero, one, or two following count bytes. Literal runs use the same low-four-bit base with optional 2-byte count when bit 4 is set.

The target rejects counts reaching/exceeding `0xfffff` in the observed guard and returns failure. The final decoded cursor is compared against the expected image area by the reconstructed decoder.

### Alternate `gG` / PNG carrier

If the first two bytes are not `RD`, target `decoder()` checks little-endian magic `0x4767`, i.e. bytes `gG`. On this branch it calls `decoderPng()` @ `0x2f5310`.

`decoderPng()` treats the same header layout as width/height/size metadata, passes the payload at `+0x10` with length `size - 0x10` to `IMG_LoadPNG_MEM`, writes width and height, and reports output length as `width * height * 4`.

Therefore the target Real-image decoder has two independently observed containers:

~~~text
RD  -> raw / custom RLE / zlib RGBA
gG  -> in-memory PNG -> RGBA
~~~

The `gG` path is now decoded by `decodeStoneAgePngWrappedAsync()` in the browser using `createImageBitmap()` and Canvas 2D pixel extraction. This closes the Web visual decoder path, but does not claim byte-for-byte equivalence with the target SDL surface's color handling.

### Existing project decoder correction

The target recheck found one previous Web contract mismatch: the old project decoder rejected every compression flag >= `0x10`. That was too strict. The target explicitly accepts `0x20` as its zlib/4-byte-pixel branch and sends other non-zero flags through the RLE branch.

`src/stoneage_rd_decoder.mjs` has now been corrected to mirror this target branching. `tools/check_v317_rd_decoder.mjs` now covers raw, RLE, zlib `0x20`, RD magic, and `gG` classification.

The actual target `real.bin` payload is still unavailable, so this closes the decoder **contract**, not a concrete target image.


## Expanded native map/resource evidence coverage

The focused CI evidence now retains the target's map-cache lifecycle (initMap, createMap, setMap, writeMap, readMap), collision and edge-prefetch routines (readHitMap, checkHitMap, checkEmptyMap, checkEmptyMapData, _checkEmptyMap), movement/route helpers, automap/effect helpers, and resource cleanup/loader entry points. Their disassembly is published as supporting evidence; names and instruction excerpts alone are not treated as complete runtime semantics.

The audit gate compares focused native function and global-object name sets between the packaged armeabi-v7a and x86 libraries. It also requires every function/object selected by the native auditor to be published, every focused function's disassembly to complete without excerpt truncation, and the core map/resource function set to be present in both ABIs. These are inventory and extraction-completeness checks, not proof of instruction-level equivalence or successful runtime behavior.


The focused artifact now publishes every function selected by the native map/resource symbol filter instead of a second manually maintained name allowlist. It also includes the filtered global object symbols, and CI checks object-name parity across x86 and ARMv7. This prevents newly discovered in-scope symbols from silently disappearing from the published evidence simply because a secondary list was not updated.



## World-map Lua bridge and window dispatch

The target's world-map path is now recorded separately from tile-map decoding. The APK contains `initWorldMap()`, `worldMapProc()`, and `mapWndProc()` in both packaged ABIs; their build-specific entry addresses are in `data/generated/stoneage_ro0000_android_native_resource_layout.json` under `worldMapRuntime.functions`.

`initWorldMap()` and `worldMapProc()` resolve a Lua context with `FindLua(char*)`. When the context is absent, each chooses between a formatted path buffer and a copied path buffer before resolving it. The concrete path and embedded strings remain intentionally omitted. Both then fetch a Lua field at `LUA_GLOBALSINDEX` (observed numeric index `-10002`) and require `lua_type(...,-1) == 6` (function).

- `initWorldMap()` calls `docall(L,0,1)` for a function-valued field. If the field is not a function, it clears the pushed value with `lua_settop(L,-2)`. The function itself returns void; its visible body does not inspect the local `docall` result.
- `worldMapProc()` calls `lua_pcall(L,0,1,0)`. A failed protected call reads the top stack value with `lua_tolstring`, sends it to `SDL_Log`, clears the stack to `-2`, and returns 0. On success it checks `lua_isnumber(L,-1)`; numeric results are converted to a signed C `int` (truncation toward zero), the stack is cleared, and the integer is returned. Missing context, a non-function field, and a nonnumeric result all produce 0.
- A notable unresolved runtime risk is visible in the target body: the successful-but-nonnumeric branch returns 0 without an explicit `lua_settop` call, unlike the function-type error, pcall-error, and numeric-result branches. This may leave the result on the Lua stack; repeated-call accumulation has not been measured in the original runtime and is not asserted as a confirmed leak.

`mapWndProc()` is gated by the high UI flag bit (x86 mask `0x40000000`, equivalent to ARM byte offset 3 / mask `0x40`) and a separate state value equal to 9. The target creates its window through `MakeWindowDisp(0x184,4,248,240,0,-1,false)`; after creation it clears the returned surface and sets a one-byte initialization flag. Each audited ABI submits three `StockFontBuffer` and three `StockDispBuffer` calls for the window's content. A window-state value of 1 enters the `worldMapProc()` call path. The internal state and the returned integer's precise UI meaning are left unlabeled where the native field semantics are not independently established.

`setWarpMap(x,y)` accepts two integer coordinates, stores both in target state, and converts each to the floating-point coordinate frame by multiplying by 64.0. It then resets two word-sized fields to zero, sets one float field to 1.0, writes -1 to four word-sized state fields, sets a short flag to 1, and calls `crossAniRelease()` and `ReleaseSpecAnim()`. This matches the client’s 1/64-unit coordinate convention, but the reset fields are kept as raw effects rather than assigned unverified names.

The separate `EndWarpMap()` routine tests a state byte's low bit; when set, it increments a counter and clears the byte. The state/counter names are not inferred from offsets alone.

These functions close the Lua bridge and window-dispatch control flow at the static code level. They do not reveal the omitted Lua script body, establish the meaning of its numeric return codes, or demonstrate the resulting map contents. The machine-readable anchors and evidence boundary are in `worldMapRuntime` within `data/generated/stoneage_ro0000_android_native_resource_layout.json`.

## SDL client loop, input dispatch, and movement events

The target's SDL entry, frame loop, event dispatcher, keyboard/mouse adapters, socket loop, and movement/event dispatch are now recorded in \`data/generated/stoneage_ro0000_android_client_loop_contract.json\`.

- \`SDL_main\` initializes SDL and client-wide state, prepares directories/conversion support, creates the window, initializes the singleton runtime, enters \`GameMain\`, and performs teardown on return. Initialization and window-creation failure paths call \`SDL_Quit\`.
- \`GameMain\` coordinates the frame work, including \`networkLoop\`, \`joy_read\`, \`ScriptRunningProcess\`, \`Process\`, \`MouseProc\`, \`AniProc\`, display ordering, \`HitMouseCursor\`, \`PutBmp\`, \`Flip\`, and \`SDL_Delay\`. Resource and battle-map initialization/repair routines also appear in its call path.
- \`EventProc(unsigned int, SDL_Event*)\` routes keyboard actions including left/right/return/backspace and dispatches mouse point, click, and double-click adapters after coordinate conversion through \`GetRealX\` / \`GetRealY\`. The Android JNI keyboard-change callback is exported by both packaged ABIs; its disassembly checks the global input-focus pointer and an input-related field at offset \`0x24\` against 100, then calls \`CallbackInputBoxData(int, int)\` on the active path. The field's exact structure meaning is not established, so this is not labeled as a verified text-length limit.

- \`GetRealX(int)\` and \`GetRealY(int)\` multiply incoming pointer coordinates by their axis-specific scale and integer-divide by the current resolution-mode fields at offsets \`0x20\` and \`0x24\`, respectively. \`MouseNowPoint(int,int)\` upper-clamps its x/y values against current-mode fields at offsets \`0x18\` and \`0x1c\`, then stores them at offsets 0/4 of the mouse-point state. The observed routine does not show a lower-bound clamp; browser pointer confinement must not silently assume one.
- \`networkLoop\` reads from a socket with \`select\`/\`recv\`, appends bytes to the read buffer, dispatches complete messages through \`SaDispatchMessage\`, and sends pending bytes with \`send\`. Echo message senders are called from the loop.
- \`moveProc\` invokes automatic movement and interaction helpers. \`onceMoveProc\` ties together route lookup, event checks, movement-route sending, map prefetch, local step movement, and map-area updates. \`_execEtcEvent\` branches to warp, encounter, and enemy-event senders; warp and enemy senders reset local map state before the event message is sent.

The evidence distinguishes input dispatch, frame processing, network dispatch, route/collision checks, map-edge streaming, coordinate movement, and server event requests. It does not establish exact device touch behavior, server acceptance, or persistence without runtime/network traces. ABI symbol parity and successful disassembly are extraction-coverage checks only.


The loop and movement contracts are also checked against the current APK's native ELF audit in CI. For every function/address pair in both contracts, the checker verifies presence in the corresponding focused symbol inventory and matches the recorded ABI-specific symbol value, shared-library SHA-256, and Build ID. This guards the evidence anchor itself; semantic observations still require review when the target build changes.

## Auto-action bridge: getAutoAct()

Android target 的 getAutoAct() 已確認為實際遊戲互動 hook。

- native 取得 Lua context 後，以 lua_getfield(..., autoactMap) 取得名為 autoactMap 的 Lua 欄位。
- 欄位必須是 Lua function（type 6），否則結果為 0。
- 以 lua_pcall(L,0,1,0) 執行；錯誤或非數值結果回傳 0。
- 數值結果轉成 C int；成功後清除 Lua stack。
- moveProc() 在觀察到的 mouseLeftCrick 觸發條件下呼叫 getAutoAct()；只有回傳 1 才送出 lssproto_AC_send(playerId,currentX,currentY,0)，之後執行 setPcAction(0)。

這可直接轉成 browser action／interaction contract；Lua autoactMap 本身內容與 AC 封包的 server-side 語義仍未由 APK 單獨證明。

Machine-readable evidence：data/generated/stoneage_ro0000_android_auto_action_contract.json。


## Battle target routing and skill command protocol

Android target 的戰鬥目標選擇鏈已再往下閉合，證據直接來自目標 APK 的 x86 `libStoneage.so`；這一節不把公開 Fixed-C C source 的名稱或版本直接套回 APK。

- `BattleSetWazaHitBox(int,int)`：x86 `0x1011c0`、7498 bytes。第一參數在 `typeflag=0` 時是技能索引；`typeflag=1` 時直接視為 target mode。目標模式 0..11 已逐項追到 native 分支，包含自己、單目標、我方/敵方整側、全體、不含自己/寵物、單排、單線、死亡目標，以及特殊單排模式。
- 寵物技能 target 欄位位於每筆 record 的 `+0x06`；x86 觀察到 per-skill stride 154 bytes、per-pet stride 5390 bytes。職業技能 target 欄位位於 `+0x04`，record stride 280 bytes（`0x118`），costmp 位於 `+0x10c`，skillId 位於 `+0x02`。
- `BattleTargetSelect()`：x86 `0x103c50`、7001 bytes。已確認六種命令型態：一般攻擊、咒術、抓捕、道具、寵技、職業技能。
- 目標 APK 的封包字串已直接閉合：`H|%X`（攻擊）、`T|%X`（抓捕）、`J|%X|%X`（咒術）、`I|%X|%X`（道具）、`W|%X|%X`（寵技）、`P|%X|%X`（職業技能）。此外存在地圖型寵技的 `W|FF|FF` 路徑。
- 職業技能的整側/全體 target code 已直接確認：我方為 `0x14/0x15`、敵方為相反側的 `0x15/0x14`、全體為 `0x16`；特殊 target mode 8/11 依選取位置 0..4、5..9、10..14、15..19 映射到 `0x1a/0x19/0x17/0x18`。普通直接目標則直接使用選到的 target index。
- native 中另有未輸出的本地 helper（起點約 `0x10bcb0`），會以 target state 的 `+0xc0` 值與職業技能 `costmp` 比較；一般條件是資源值不小於 costmp。當資源不足時，實際 APK 額外允許 skillId 75/76/77，但僅在該技能 costmp==0 的情況下成立；成功後寫入選定職業技能索引並呼叫 `BattleSetWazaHitBox(target,1)`。
- 目前可以安全用來重建 browser 的「技能目標模式 + 封包組裝 + 職業技能自動提名門檻」。但 server 對 `0x14..0x1a` target code 的最終語義、傷害/狀態/MP 扣除/cooldown，以及 `+0xc0` 的完整結構名稱仍未由 APK 單獨證明。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_battle_target_protocol_contract.json`。


## Profession-skill receive, classification, and Lua-backed type

APK 的職業技能資料接收鏈已再閉合一層，這次直接從 target native binary 追到 `lssproto_S_recv('S')` → `SortSkill()` → 戰鬥技能 UI。

- `lssproto_S_recv()` 的 `S` 分支先清空 26 筆職業技能 record，再逐筆以每筆 9 個 token 解析：`useFlag`、`skillId`、`target`、`kind`、`icon`、`costmp`、`skill_level`、`name`、`memo`。
- x86 target record stride 為 280 bytes；直接解析欄位可定位到 `+0x00`、`+0x02`、`+0x04`、`+0x06`、`+0x108`、`+0x10c`、`+0x110`，另外在 `+0x114` 寫入 `getProfessionSkillType(skillId)` 的回傳值。
- 收完 26 筆後立即呼叫 `SortSkill()`。native 固定將 `kind=1` 放入 `BattleSkill[]`、`kind=2` 放入 `AssitSkill[]`、`kind=3` 放入 `AdvanceSkill[]`；每組容量 20，並保持原始 record index 的遞增順序。其他 kind 不進這三組。
- `BattleButtonPPLSKILL()` 再以三組索引陣列分別呈現職業技能選單，最多 4×4 格；實際選取前仍檢查 `useFlag`、MP/costmp，以及 APK 已確認的特殊技能限制。
- `getProfessionSkillType(int)` 位於 x86 `0x393d10`，輸入就是剛解析的 `skillId`。它會取得 Lua 的 `getProfessionSkillType` 函式，要求 Lua type 6，push skillId 後以 `lua_pcall(L,1,1,0)` 執行；錯誤/非數值回傳 -1，數值以 native 整數轉換後回傳並清理 Lua stack。
- 該回傳值在 `BattleButtonPPLSKILL()` 中再加上 `0xf4fa`，作為技能 UI 圖像編號來源；因此 `getProfessionSkillType` 與 `kind` 是兩個不同層級的資料：`kind` 負責 Battle/Assist/Advance 分類，Lua type 則參與 UI 圖像選擇。
- 目前仍不把 Lua `getProfessionSkillType` 的數值表硬推成產品語義，因為對應 Lua 函式本體不在 APK 封裝內。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_profession_skill_runtime_contract.json`。


## BATTLESKILL non-battle profession-skill protocol

目標 APK 的 `BATTLESKILL` 鏈已在 x86 與 ARMv7a 兩個 native ABI 都確認。

- x86 `lssproto_BATTLESKILL_send(int,int)` 位於 `0x409500`；ARMv7a 位於 `0x28ee19`。兩者都把單一 `skillNum` 以 `util_mkint` 編碼、加入 checksum，再以 message type `110 (0x6e)` 呼叫 `util_SendMesg`。
- x86 `lssproto_BATTLESKILL_recv(int,char*)` 位於 `0x284f50`；ARMv7a 位於 `0x1c3db9`。兩者都直接對完整 `data` 做 `SDL_atoi`，取得 native player state 的 active `ACTION`（觀察到 offset `+0x5504`），再呼叫 `setCharMind(activeAction, parsedInt)`。目標函式本身沒有看到額外欄位解析或封包語義判斷。
- 目標 dispatcher 會先處理封包 framing/checksum，再進入 `lssproto_BATTLESKILL_recv`；因此 `BATTLESKILL` 的 body 是「一個整數」而不是 `H/J/W/P` 這類 battle command string。
- `ScriptFunc_petSkillState` 也完成雙 ABI 對照：x86 `0x39dfe0`、34 bytes；ARMv7a `0x256fc9`、20 bytes。可見 body 最終固定回傳 `1`，參數只被保存到 stack temporary，沒有觀察到可命名的 gameplay state 寫入；因此目前只標為 script success bridge，不替它賦予未證實的「寵技狀態」語義。
- 作為 server 端的外部交叉驗證，公開 Fixed-C C source 的 `GmsvServer_BATTLESKILL_recv` 會在非戰鬥狀態下，把收到的 skill number 透過 `PROFESSION_SKILL_GetArray` 對回職業技能，檢查角色職業，最後呼叫 `PROFESSION_SKILL_Use`。這部分明確標記為 cross-source semantic reference，沒有宣稱與 target APK 為同一 server/version。

因此，對目前重建專案最安全的模型是：`BATTLESKILL` 與戰鬥中的 `P|...` 職業技能命令分開；前者是非戰鬥的整數技能通道，後者才是 battle target-selection command。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_battleskill_protocol_contract.json`。


## Android battle receive path: C/P/A/U and command-ring boundary

目標 APK 的 `lssproto_B_recv()` 已直接由 x86/ARMv7a native binary 對照完成。

- x86：`0x3f3470`、453 bytes；ARMv7a：`0x2840dc`、272 bytes。
- 分支鍵是完整 battle command 的 byte `+1`。target 版本可直接觀察到四種接收分支：`C`、`P`、`A`、`U`。
- `C`：把完整 command 原樣複製進 BattleStatus receive ring；每槽 0x1000 bytes，共 4 槽，write pointer 以 `(pointer+1)&3` 循環。
- `P`：從 `command+3` 解析 `%X|%X|%X`，填入玩家戰鬥位置 `BattleMyNo`、battle flag `BattleBpFlag`、玩家戰鬥 MP `BattleMyMp`。
- `A`：從 `command+3` 解析 `%X|%X`，填入 `BattleAnimFlag`、`BattleSvTurnNo`。當 BattleTurnReceiveFlag 處於啟用狀態時，會同步 `BattleCliTurnNo = BattleSvTurnNo` 並清掉該接收旗標。
- `U`：直接設置 Battle escape flag。
- 其他 command：完整原樣複製進獨立的 BattleCmd receive ring，同樣為 4 槽 × 0x1000 bytes，pointer 以 `(pointer+1)&3` 循環。
- 目標 APK 的該函式內沒有 `Z/F/O` 分支；公開 source 的可選 `PK_SYSTEM_TIMER_BY_ZHU` 回合計時接收分支因此不能直接移植為 target APK 行為。

這一層的意義是：battle status 與 battle action/result command 在 client 端本身就是**兩條分離的 receive queue**；後續真正的 `BattleStatus` / `BattleCmd` 解包仍由其他處理函式負責，不能把這個 receiver 本身誤當成傷害或結算邏輯。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_battle_receive_contract.json`。


## BattleStatus BC stream → ACTION state decode

這一輪把 target APK 的 `set_bc()` 再往下拆到「每個 BC participant record 實際寫入哪些 ACTION 欄位」以及 battle status flags。

- x86 `set_bc()` 位於 `0x361680`，結束於 `0x3623a3`；其 parser helper 為 `get_bc_num()`=`0x361140`、`get_bc_asc()`=`0x3612e0`、`get_bc_asc_ridepet()`=`0x3614d0`。
- BC header 第一個 hex integer 會寫入目前 battle master ACTION 的 `+0xe0`。之後每筆 participant 先讀 index，再從 participant ACTION 依序讀 name、freeName/title、graphic number、level、hp、maxHp、battleFlags、ride state、ride pet name、ride pet level、ride pet hp、ride pet max hp。
- target x86 的直接欄位寫入已確認：graphic `+0x180`、level `+0xc8`、hp `+0xb8`、maxHp `+0xbc`、ride state `+0x1d4`、ride-pet name `+0x1d8`、ride-pet level/hp/maxHp `+0x1ec/+0x1f0/+0x1f4`。name/freeName 分別由 `get_bc_asc(action,0/1)` 寫入 `+0x38/+0x78`。
- `battleFlags` 不是單純保存值，而是立即驅動 participant 的生命、離場、逆轉屬性與狀態動畫。target 直接可觀察到：`0x1` fresh、`0x2` death、`0x4` pet-ok、`0x200` fade-out、`0x400` reverse。
- target 的 status mapping 也已逐 bit 追出：`0x8..0x100` → status 1..6；`0x800..0x8000` → 7..11；`0x10000..0x8000000` 依序對應 12..23；`0x40000000` → 34。其後較低優先級的 `0x10000000` 路徑先寫 32、再以同一個 `0x10000000` 測試再寫 33，因此實際 target 的最後結果會覆蓋為 33；這個重複判斷不能被外部 header 的預期 `0x20000000` 自動修正。
- 當 status id 非 0，target 會呼叫 `set_single_jujutsu(statusId, action)`，並把 status id 寫入 ACTION `+0xcc`；無 status 則寫 0。這是目前最直接的「伺服器回合狀態 → 客戶端異常狀態/動畫」橋樑。
- target BC record 還有兩個未命名但已確認有效的效果欄位：`ACTION+0xd1c` > 0 時呼叫 `set_obj_effect(action,value)`；`ACTION+0xd20` > 0 時呼叫 `set_obj_effect1(action,value)`。
- `get_bc_num()` 是 hex stream parser：只接受 `0-9/A-F`，以 16 進位累積，遇到 `|` 回傳；遇到 NUL 則退回一個 cursor 並回傳 -1。字串 helper 則以 `|`/NUL 終止並經過 `makeStringFromEscapedPc`。
- 公開 `alrightlook/StoneAgeMobileApp` 的 `oft.cpp/vg410.h` 可對照 status flag 名稱與舊版 `set_bc()` 結構，但這裡只作 semantic reference，不宣稱與 target APK 為同一 build/version。

這層現在已足以支援 browser battle runtime 直接還原 BC participant 的 hp/maxHp/level/graphic/ride-pet/status state，不必再把 BC 封包當成黑盒字串。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_battle_status_decode_contract.json`。


## Battle BC object-effect attachment

BC participant records 還有兩個 target-native 的 effect 欄位：

- `ACTION+0xd1c` 由 BC stream 解析後，若 > 0，呼叫 `set_obj_effect(action,value)`。
- `ACTION+0xd20` 若 > 0，呼叫 `set_obj_effect1(action,value)`。
- target x86 的 `set_obj_effect` 位於 `0x33f2b0`，會檢查來源角色 `ACTION+0x11c` 空閒且 hp > 0；建立新的 effect ACTION 後，把輸入 effect number 寫到新 ACTION `+0x180`，再把 effect ACTION 掛到來源 `+0x11c`。
- `set_obj_effect1` 位於 `0x33f3a0`，對應第二個 attachment slot `+0x120`，其建立路徑與第一個 effect slot 相同，但使用另一個 target-native 的 ACTION `+0x08` 初始化值。
- 兩個建立路徑都觀察到固定的 `GetAction(0x47,0x264)` 輸入，以及建立後對來源/效果 ACTION 的 byte `+0x15` 做遞減。
- 因此 `0xd1c/0xd20` 現在可安全視為「BC 指定的兩個特殊 object-effect attachment channel」，而不是普通 battle stat。effect number 的最終圖像/特效資源對應仍要等 production resource bytes 或進一步 runtime verification。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_battle_object_effect_contract.json`。


## Battle status effect sprite mapping: set_single_jujutsu()

`set_single_jujutsu(statusId, action)` 已由 target x86 native binary 再往下閉合。

- x86：`0x33ea90`。來源 action hp 在 `+0xb8` 為 0 時直接返回；否則以 target 固定參數 `GetAction(0x47,0x264)` 建立新的 status-effect ACTION。
- 新 effect ACTION 會繼承來源的部分顯示/定位資料，並以 statusId 寫入其 effect state；其 effect graphic 位於 `+0x180`。
- target binary 的 status switch 直接可觀察到 1..23 的 effect graphic 常數：`100555,100551,100553,100550,100552,100554,101420,101417,101421,101419,101702,25500,35120,35110,27692,26517,27692,27012,27012,100554,0,0,100551`。
- status 34 對應到一組特殊 source-graphic transition：target binary 內直接出現 `101814/101815`、`101810/101811`、`101863/101864` 以及 `120113/120114/120115`、`104015/104016/104017` 等相關圖號；部分路徑還會在來源角色尚未進入死亡動作時，把來源 graphic 往前推一級。
- 這代表 BC 的異常狀態旗標現在可以一路落到「具體 status effect ACTION / sprite number」，而不只是停留在 statusId。
- status 32/33 的圖號目前仍保留 provenance boundary：公開 source 可對應到 barrier/shock 類效果，但 target switch jump-table 的靜態儲存尚未以足夠信心復原，因此不把這兩個數值宣稱為 target direct mapping。
- 公開 `alrightlook/StoneAgeMobileApp` 同名函式可作語義對照，但 target 與該 commit 的 build/version identity 不在此處宣稱。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_battle_status_effect_contract.json`。


## Persistent battle-status effect lifecycle: katino()

`set_single_jujutsu()` 建立的 status effect ACTION 直接掛到 target 的 `katino()`，這一層現在也已追完主要生命週期。

- x86 `katino()`：`0x33d450`、1647 bytes；其 parent/source action 取自 effect ACTION 的 `ATR_BODY_WORK(0)`。
- 每幀先檢查 parent：若 parent function 為 NULL、parent 已進入終止狀態（target 看到的 byte `0xfc`），或 parent hp `+0xb8` 為 0，就清除 parent 的 `JUJUTSU_WORK`（`+0x110`）並對 effect 自身執行 `DeathAction`。
- parent 仍有效時，effect 的 `+0x15` 會設為 parent `+0x15+1`。依公開 ACTION 結構對照，`+0x15` 是 `dispPrio`（display priority），不是 effect counter。
- effect 每幀跟隨 parent 的 x 座標；大多數狀態使用 parent y-64，但 target 對部分 effect graphic 有直接的特殊 y 偏移：`100551` 使用 parent y、`35120/101702/27692/35110/26517` 使用 parent y-34。
- effect graphic `25500` 的 target 路徑會遞增一個 global counter，按 20/40/60/80 的區段改變 y 偏移，後兩段還會增加 x+16；到 80 循環回 0。這是 target binary 直接可觀察的動畫位置調整。
- LER/特殊演化圖號 `101810/101811/101805/101863/101864/101858` 有獨立一次性動畫路徑：當 `pattern(..., ANM_NO_LOOP)` 回傳完成時，清除 parent `JUJUTSU_WORK`、銷毀 effect，並依 source graphic 將 parent 從 `101813→101814→101815` 等狀態推進，同時重置 action/vct/方向。
- 普通狀態則走 `pattern(effect, normal-speed, loop)`，因此其生命週期由 parent 是否有效以及 status effect 自己的動畫/終止狀態共同決定，而不是由一個固定秒數直接截斷。

這使得目前的 BC → status → effect 鏈已可完整描述為：

`lssproto_B_recv(C)` → `BattleStatus ring` → `set_bc()` → `statusId` → `set_single_jujutsu()` → `katino()` → status effect ACTION / sprite / lifecycle。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_battle_status_effect_contract.json`。


## Battle command ring → master parser → damage result application

這一輪把普通戰鬥命令的讀取端、命令邊界解析與結果套用再向下閉合。目標是描述 APK 客戶端實際消費哪些欄位；不把客戶端動畫／狀態更新誤認為伺服器戰鬥公式。

### Function anchors and receive queue

- target x86：`BattleProc()` 位於 `0x10c790`（9,590 bytes）、`master(action*)` 位於 `0x359eb0`（17,284 bytes）、`get_num()` 位於 `0x3408e0`（408 bytes）、`get_command_asc()` 位於 `0x347740`（500 bytes）。
- ARMv7a 對應符號：`BattleProc()` `0x0f69c1`（6,364 bytes）、`master(action*)` `0x234eb1`（9,348 bytes）、`get_num()` `0x22753d`（252 bytes）、`get_command_asc()` `0x22b1a1`（332 bytes）。ARM 函式值含 Thumb state bit；此處記錄符號值，語義核對以 target x86 指令為主。
- 普通命令由 `lssproto_B_recv()` default branch 寫入獨立的 `BattleCmdBak`：4 個槽位、每槽 0x1000 bytes。target `BattleProc()` 在讀寫指標不同時複製一槽到 `BattleCmd`，再以 `(readPointer+1)&3` 推進讀指標。
- 這條 queue 與 `C` branch 的 BattleStatus ring 分離；後者仍由 `set_bc()` 解碼。普通命令被搬到 `BattleCmd` 後，才由戰鬥 master action 消費。

### Command and token parsing

- target 的 `master(action*)` 內含 local `get_command()`，x86 位於 `0x35e240`（相對 master 起點 `+0x4390`，不是獨立匯出的函式）。它在命令邊界尋找 `B<opcode>|`：`B` 前一 byte 必須是 `|` 或字串起始／NUL 邊界；找到後回傳 opcode byte，掃描時遇到 NUL 則回傳 -1。
- `get_num()` 以大寫十六進位 nibble 累積數值。開始解析前會略過非十六進位字元；解析開始後遇到非十六進位字元即結束 token，游標留給呼叫端按格式處理。輸入在數字前即遇 NUL 時回傳 -1。
- `get_command_asc()` 將文字讀入 4 個、每個 128 bytes 的緩衝區。TAB 結束目前欄位並切換下一格；`|` 或 NUL 結束讀取。其 byte-copy 分支依首 byte 高位形態複製 1、2 或 3 bytes，屬舊式多位元組字元處理，不是通用 UTF-8 decoder。
- 上述兩個 parser 在觀察到的 native 路徑中沒有明確的 token／欄位長度上限檢查。重建端應採有界解析並對不合法輸入 fail-closed，不應照搬可能越界的讀取方式。

### Target-observed command dispatch

`master()` 依 `get_command()` 回傳的 opcode 更新 ACTION 與戰鬥表現。target binary 可直接觀察到下列處理路徑：

| Opcode | Target 觀察到的處理 |
|---|---|
| `K` | 建立／更新戰鬥文字視窗，透過 `get_command_asc()` 讀取最多四個 TAB 欄位，並播放 sound 202。 |
| `j` | 存在戰鬥效果分支；具體效果仍受編譯功能路徑限制。 |
| `b` | battle-model 路徑會初始化參與者的 ACTION／攻擊表現資料並建立或重用攻擊 ACTION。 |
| `V` | 當先前解析的索引走出一般參與者範圍時，進入變數更新路徑。 |
| `M` | malfunction／status-result 路徑，會更新參與者狀態並依分支建立或移除狀態 ACTION。 |
| `D` | 傷害／結果套用路徑；`ATT_DAMAGE` 名稱由固定版本的公開 source 作語義交叉參考，非 target APK 的版本身分宣告。 |

### D result records and local state changes

- `D` 命令會先解析目標參與者，再解析結果 category、subtype 與數值。客戶端消費伺服器提供的結果數值，對 ACTION 的 HP、MP、寵物 HP 與顯示狀態作本地更新；這段 consumer 沒有提供權威命中／傷害計算公式。
- target category 0 / subtype 0：顯示 popup 6，扣除 participant HP 與可選 pet damage，HP／寵物 HP 低於等於 0 時歸零，並處理 hit mark、受傷動畫及相應的 pet-fall 轉換。
- category 0 / subtype 1：顯示 popup 14，回補 HP 與可選寵物數值，分別限制在 max HP／max pet HP，並播放 sound 102。
- category 0 / subtype 2：顯示 popup 36；回補 HP、套用該路徑的可選 MP 數值並回補寵物數值，回補上限由對應 max 欄位限制。
- category 0 / subtype 3–6：顯示 popup 37–40，重置動畫狀態並進入結果動畫流程；在這些分支中未觀察到 HP／MP 數值寫入。target 還有其他條件式 popup 分支，但未把其功能名稱從外部語義推定成 target 已證實行為。
- category 1 / subtype 0：顯示 popup 16，扣除 MP 並限制下限為 0。
- category 1 / subtype 1：顯示 popup 15，回補 MP；公開語義參考中的 `_FIXSHOWMPERR` 路徑使用 `pc.maxMp`，否則限制於 100，並播放 sound 102。這項編譯條件名稱僅作交叉參考。
- target 在處理一筆 `D` 結果後，會探測下一個命令。若下一筆仍是 `D` 且 category／subtype 與目前群組相同，就回到結果迴圈處理下一位參與者；否則恢復命令游標，把下一命令留給外層 state machine。這是連續同類結果的合併消費，不代表伺服器只送出一筆傷害。
- 寵物數值欄位與部分特殊結果的具體協議意義仍需以 target 行為和實際封包樣本交叉核驗；目前不從欄位名稱反推 server-side 計算方式。

公開 `alrightlook/StoneAgeMobileApp` 的 `oft.cpp`（commit `8c870c87ce1305c52fb6713bf824619467847bba`）僅作 `ATT_DAMAGE`、結果類別與可選功能的語義對照，未宣稱與 target APK 同一來源版本。

### Damage-number ACTION creation and lifecycle

`D` 結果路徑呼叫 target 的 `set_damage_num(action*, color, v_pos)`。x86 位於 `0x33d0f0`（855 bytes），ARMv7a 位於 `0x225445`（572 bytes）。它嘗試以 `GetAction(0x4a,0x264)` 配置飄字 ACTION；配置失敗時直接結束。配置成功後，會設定 `ACTION+0x15=0x59`、將 x 設為來源 ACTION 的 x、將 y 設為來源 y 加上 `v_pos`，並初始化 `ACTION+0x170=24`、`ACTION+0xe0=2`。

新 ACTION 的 work 欄位會記錄顯示類型（`+0x130=color`）和來源 ACTION 指標（`+0x08`），並複製數值／旗標來源：`+0x12c ← source work+0x58`、`+0x230 ← source work+0x22c`、`+0x234 ← source ACTION+0x1d4`、`+0x238 ← source work+0x238`、`+0x240 ← source work+0x240`。當來源 `work+0x244==1` 時，另複製 `+0x23c` 與 `+0x244`。這些偏移保留為 target-observed 欄位，未因欄位值或公開結構名稱而擴張語義。

另有一個直接可見的附加效果分支：當顯示類型為 3，且來源 graphic（`ACTION+0x180`）是 `0x18db7`（101815）、`0x1d532`（120114）或 `0x19650`（104016）時，函式會嘗試建立 `GetAction(0x47,0x264)`，把 effect graphic 設為 `0x18de2`（102882），以來源 ACTION 為關聯，並將效果位置設為來源 x/y 各加 10、顯示優先序設為來源 `+0x15` 加 1。此處只確認條件、欄位與 graphic 數字，不單靠圖號替效果命名。

### Per-frame state machine

飄字 callback `showDamage_num(action*))：x86 `0x33b090`（8,282 bytes），ARMv7a `0x22429d`（4,520 bytes）。其 work byte `+0x00` 是狀態判斷欄位，`+0x01` 是倒數欄位；work `+0x08` 保存來源 ACTION 指標。這些是依使用方式命名的稽核欄位，不宣稱為原始 C struct 成員名稱。

| work[0] | 每次 callback 的動作 | 狀態轉換 |
|---|---|---|
| 0 | `ACTION+0x170 -= 2` | 降至 0 時，設定 `ACTION+0x174=16`，並令 `work[0]=1`。 |
| 1 | `ACTION+0x170 += 2` | 達到或超過 24 時，設定 `work[1]=60`，並令 `work[0]=2`。 |
| 2 | 將 `ACTION+0x170` 設為 0，並以 byte 操作遞減 `work[1]` | 倒數遞減結果為 0 時，清除來源 ACTION 的 `+0xd10` 關聯欄位，對飄字 ACTION 呼叫 `DeathAction()`。 |

入口另有一個由兩個 global 值組成的狀態更新閘門：第一個觀察值非零，且第二個觀察值的低兩位非零時，會跳過上述狀態遞進；顯示流程仍可繼續。這兩個 global 的語義名稱尚未由 target 證實，因此不將它們直接標成暫停、加速或其他遊戲機制。

未走到倒數歸零的正常 callback 尾端會呼叫 `pattern(action,0,1)`；歸零分支呼叫 `DeathAction()` 後直接離開，不走一般尾端。x86 與 ARMv7a Thumb 指令對狀態 byte、每次步進 2、門檻 24、倒數 60、清除 `+0xd10` 及死亡釋放流程相互吻合。

### Damage-number rendering boundary

callback 依 work `+0x130` 選擇格式分支，透過 `sprintf` 組合固定 0x100-byte 的暫存文字，再呼叫 `stockFontNumToDamage()`；可見的字型編號為 101（`0x65`）。部分路徑透過 `getFontNumWidthToDamage()` 計算寬度並水平置中；其他路徑使用固定 battle-font mode。work `+0x238` 非零時，會在 y+12 額外提交一組文字（mode 2）；work `+0x234==1` 時，會再於 y+60 提交另一組文字。work `+0x244==1` 則走另一種主文字 mode 3 路徑。

若來源 ACTION 的 `+0xd10==2`，callback 會額外呼叫 `StockDispBuffer()`，位置為飄字 ACTION 的 x+2、y−22。該額外 callback 的實際畫面意義尚未由 target 靜態證據單獨確定。這些繪製呼叫確認的是客戶端呈現管線，不代表伺服器傷害計算。

Machine-readable evidence：`data/generated/stoneage_ro0000_android_battle_command_decode_contract.json`。契約會在 CI 中對照 APK／ELF identity 及 x86、ARMv7a 函式位址；完整字形映射、每個特殊格式分支的視覺等價與裝置端播放仍未完成驗證。
