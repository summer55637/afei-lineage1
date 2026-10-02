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
| 8 | 2 × A × B bytes | Plane 1: A × B sequential 16-bit cells |
| 8+2AB | 2AB bytes | Plane 2: A × B sequential 16-bit cells |
| 8+4AB | 2AB bytes | Plane 3: A × B sequential 16-bit cells |

Here A and B denote the two stored dimensions in argument order; the x/y orientation is not established. The blank cache file produced by `createMap` is therefore 8+6AB bytes, assuming the writes complete successfully. The three planes are initialized with 16-bit zero values.

`readMap` opens the same path, reads the two 4-byte header values, and then performs three separate row-oriented reads into three `unsigned short*` output buffers. The plane bases advance by 2AB bytes each, matching the layout above. It also converts the header dimensions for float outputs by dividing them by two; the higher-level meaning of those float outputs is not established by this function alone.

`writeMap` opens the same path, reads the header dimensions, adjusts the requested rectangle, and performs three corresponding row-oriented writes at the existing plane offsets. During the write path it may also call `setEventMemory` for qualifying first-plane cells. This confirms that the native code can read and update the three planes, rather than merely creating an empty file.

The `0xAB2-byte clear size used for some map output buffers is 2,738 bytes, or 1,369 16-bit cells. This is a fixed output/window buffer size in the inspected code and must not be treated as the full map dimensions.

This identifies a native local map-cache format with a header and three planar cell arrays. It does not identify the semantics of each plane, prove that these files are the source of authoritative world maps, or establish a mapping to server map IDs. In particular, this `map/%d.dat` cache is separate from the `path/map4/real.bin` Lua loading container and from the server's Fixed-C LS2MAP format.


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

## Interpretation boundary and remaining work

This audit now includes static ELF metadata and focused disassembly, but it is not a full decompilation or runtime trace. Still unverified:

- APK signing certificate identity.
- The complete record layout and all semantics of the `spradrn.bin` index.
- The actual `path/map4/real.bin` bytes and decoded entry payloads; only its record-reading envelope is known.
- The complete meaning of all 80 bytes in an `adrn` record.
- The source format and contents of the actual `s/real.bin`, `adrn.bin`, `spr.bin`, and `spradrn.bin` files.
- The complete rules in `checkEmptyMapData` and the exact meanings of all `readHitMap` output buffers.
- Whether the referenced resources are bundled elsewhere, downloaded, or selected through an update list.
- Server endpoints, update protocol, and in-game behavior/screenshots.

Do not use this APK audit alone to rewrite server maps or the Fixed-C LS2MAP contract. Keep Android resource semantics separate until actual resource bytes and runtime evidence establish a mapping.

## Reproducibility

APK archive and Manifest audit:

```sh
python3 tools/audit_ro0000_android_apk.py \
  --apk 'ro0000/client/android/冰河石器-隐盟.apk' \
  --output artifacts/ro0000_android_apk_audit.json \
  --baseline data/generated/stoneage_ro0000_android_apk_audit.json
```

Native ELF inventory and focused disassembly:

```sh
python3 tools/audit_ro0000_android_native.py \
  --apk 'ro0000/client/android/冰河石器-隐盟.apk' \
  --output artifacts/ro0000_android_native_elf_audit.json \
  --extract-dir artifacts/native
```

CI runs both test suites, checks the archive/Manifest identity against the committed baseline, analyzes both embedded `libStoneage.so` files, and publishes the JSON reports plus extracted native libraries as a 30-day artifact. Latest successful native-disassembly run: https://github.com/summer55637/afei-lineage1/actions/runs/36996292512
