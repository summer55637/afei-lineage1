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

The four path templates have not yet been resolved to a verified argument-to-filename mapping. The observed four path strings remain useful leads, but do not establish which concrete file each call opens.

### Decoded 80-byte record: fields verified by accessors

The following are offsets in the decoded record, not offsets in the APK or an independently verified on-disk file format.

| Accessor | Observed record offset | Observed operation |
|---|---:|---|
| `realGetPos` | 12, 16 | Reads two 32-bit values and writes them through two `short*` outputs |
| `realGetWH` | 20, 24 | Reads two 32-bit values and writes them through two `short*` outputs |
| `realGetHitPoints` | 28, 29 | Reads two bytes and writes them through `short*` outputs |
| `realGetHitFlag` | 30 | Reads a 16-bit value and, on the ordinary path, returns its remainder after division by 100; there are special ID branches |
| `realGetPrioType` | 30 | Reads the same 16-bit value and returns its integer quotient after division by 100 |
| `realGetHeightFlag` | 32 | Reads a 16-bit value |
| `realGetSoundEffect` | 64 | Reads a signed 16-bit value |
| `realGetWalkSoundEffect` | 66 | Reads a signed 16-bit value |

These findings establish part of the decoded record layout and the accessor behavior. They do not establish the meaning of unobserved bytes or prove that the decoded record itself is a map tile.

### Hit-map runtime

- The native global symbol `hitMap` is 2,738 bytes in both builds. That size equals 1,369 16-bit cells, or 37 × 37 cells; the dimensions are inferred from the symbol size, not from a named width/height field.
- `readHitMap` iterates a requested rectangle, reads 16-bit map values using a row/width-based index, calls `realGetNo` and `realGetHitFlag`, and writes 16-bit result values including 1 and 2.
- `checkHitMap` converts the queried coordinates relative to map origins. It returns true for out-of-bounds coordinates; for in-bounds coordinates it reads a 16-bit cell and tests whether it equals 1.

This confirms that the native client has a distinct HitMap construction/query path and that cell value 1 is treated as a hit by `checkHitMap`. It does not prove that this value is interchangeable with the server's map tile IDs or Fixed-C walkability rules.

## Interpretation boundary and remaining work

This audit now includes static ELF metadata and focused disassembly, but it is not a full decompilation or runtime trace. Still unverified:

- APK signing certificate identity.
- The exact four path format strings and which file each path denotes.
- The complete meaning of all 80 bytes in an `adrn` record.
- The source format and contents of the actual `map4/real.bin`, `s/real.bin`, `adrn.bin`, `spr.bin`, and `spradrn.bin` files.
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
  --output artifacts/ro0000_android_native_elf_audit.json
```

CI runs both test suites, checks the archive/Manifest identity against the committed baseline, analyzes both embedded `libStoneage.so` files, and publishes the JSON reports as a 30-day artifact. Latest successful run: https://github.com/summer55637/afei-lineage1/actions/runs/36995299771
