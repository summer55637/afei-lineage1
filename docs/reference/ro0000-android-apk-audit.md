# RO0000 Android Client APK: Static and Native ELF Audit

更新日期：2026-10-02

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

This closes the listed accessor-visible fields, **not the complete 80-byte record**. Bytes 0x00–0x0B, 0x22–0x3F, and 0x44–0x4F remain unassigned by this getter set; other loader/render call sites may still use them. The complete machine-readable field/accessor summary is in `data/generated/stoneage_ro0000_android_native_resource_layout.json`.

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

## Android Manifest, DEX, and signing

The expanded binary AndroidManifest parser now records the launcher component, application metadata, declared permissions, service declarations, and GL ES feature requirement, not just package/version/SDK fields. The target manifest declares `RenderActivity` as MAIN/LAUNCHER, `StoneageApplication` as the Application class, an exported `DownloadService`, and a required OpenGL ES 2.0 feature. It also requests storage, network, Bluetooth, phone-state, overlay, audio, vibration, logging, and package-install permissions. These declarations are not proof that every permission is granted or used successfully at runtime.

The DEX inventory is a structural inventory of the packaged `classes.dex`: DEX 035, 1,410 class definitions, 10,513 declared methods, 13,808 method references, and 115 native-method declarations. The APK contains one `classes.dex`. A pinned JADX 1.5.6 pass scans the game, updater and SDL package prefixes and additionally inspects the five vendor classes that own DEX native declarations. The output retains all game/updater/SDL source classes plus those five vendor native-owner classes. It includes class/method names, ordered redacted call identifiers, source line numbers, and only simple safe identifiers passed to `System.loadLibrary`; source code, comments, URL/host strings, and general string/character literal contents are excluded. Per-method `callSites` counts matched call expressions, `callSequence` preserves source order, and `uniqueCallIdentifierCount` / `calls` describe unique call identifiers.

The static Java evidence closes these wrapper-level relationships:

~~~text
StoneageApplication.onCreate
  -> cache application context / app version

RenderActivity.onCreate
  -> set current Activity
  -> memory / root availability checks
  -> release packaged font and skin files
  -> initialize crash / voice SDKs and SDL

UpdateChecker.checkForDialog / checkForNotification
  -> CheckUpdateTask.execute
      -> doInBackground -> HttpUtils.get
      -> onPostExecute -> parseJson
          -> showDialog -> UpdateDialog.show
          -> showNotification -> Android notification

UpdateDialog.goToDownload
  -> start DownloadService
      -> onHandleIntent
          -> HTTP connection / stream to local file
          -> updateProgress -> notification
          -> installAPk
~~~

The exact update URL and other host/configuration strings remain omitted. The DEX declares six JNILibrary callbacks covering keyboard state, login result, order-check result, ZIP progress, and battery updates; SDLActivity has its own native lifecycle and input boundary. These are static call/reference relationships only: reflection, native side effects, asynchronous scheduling, and actual network/device behavior are not established by decompilation.

The signature audit preserves the APK unchanged. `apksigner` fails verification for the default, API 24, and API 28 profiles with a v1 `META-INF/MANIFEST.MF` entry digest mismatch. The certificate embedded in `META-INF/CERT.RSA` has SHA-256 fingerprint `a40da80a59d170caa950cf15c18c454d47a39b26989d8b640ecd745ba71bf5dc`. The certificate fingerprint alone does not identify a real-world publisher. The APK is not re-signed as part of this reconstruction.

## JNI declaration/export cross-check

The DEX declares 115 native methods across 11 declaring classes. The full audit now extracts each shared library packaged in the APK for both available ABIs and compares declarations against defined, default-visible Java_* exports. The matching logic checks both short and signature-qualified JNI symbol forms.

Per ABI, the packaged native library set is:

- libGCloudVoice.so
- libSDL2.so
- libSDL2_image.so
- libSDL2_mixer.so
- libSDL2_ttf.so
- libStoneage.so
- libhidapi.so
- libmpg123.so

The resulting comparison is identical for x86 and ARMv7:

| Result | Count per ABI | Interpretation |
|---|---:|---|
| Static JNI export match | 97 / 115 | The matching class/method/signature has a corresponding defined JNI export in a packaged library. |
| No static export, package-related JNI_OnLoad library present | 8 / 115 | The same package namespace has static exports in a library that also exports JNI_OnLoad; dynamic registration is possible but not proven. |
| No static export or package-related JNI_OnLoad evidence | 10 / 115 | No matching static export or same-package registration indicator was found among packaged libraries. This does not prove runtime failure. |

The 8 declarations in the second category are two ApolloVoiceEngine Bluetooth methods, SRTTAPIHTTPTaskQueueImp.callback, and five GCloudVoiceEngineHelper methods. They are kept as unresolved dynamic-registration candidates; JNI_OnLoad being exported is not itself proof that a particular method is registered.

The 10 declarations in the third category belong to com.tencent.bugly.crashreport.crash.jni.NativeCrashHandler. No matching Java_* export or same-package JNI_OnLoad association was found in the packaged library set. The APK may have an alternate loading or registration mechanism, but that requires additional evidence; this report does not classify these as broken.

The target libStoneage.so comparison remains separately visible: both x86 and ARMv7 export all six native methods declared on com.newssa.stoneage.ko.JNILibrary. Each also exports the three additional names callbackKoLogout, callbackWechatShare, and callbackYodaOpened, which have no declaration on that DEX class. Those are retained as a compatibility discrepancy, not automatically labelled stale code.

The full machine-readable comparison is data/generated/stoneage_ro0000_android_jni_audit.json. It includes per-library hashes, JNI exports, declaration candidates, ABI-level match results, and package-associated JNI_OnLoad evidence. This remains a static name-level audit; actual registration, invocation, asynchronous effects, and device runtime behavior are not established.

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
