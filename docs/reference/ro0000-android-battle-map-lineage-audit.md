# RO0000 Android Battle Map: 33×33 Format Lineage Audit

更新日期：2026-10-02

## 結論

Target APK 的 33 × 33 / 1089-cell battle-map 不是由解析錯誤造成；公開 StoneAge client source 中確實存在同一類 1089-cell / 33×33 實作先例。

目前可以建立：

~~~
legacy / older client
  -> 20×20 (400 cells)

later client variants
  -> 33×33 (1089 cells)

RO0000 target APK
  -> 33×33 (1089 cells)
~~~

但目前仍不能把 RO0000 target 直接認定為某一個公開 repository 的特定 commit；target binary 仍是最高優先證據。

## 1. Target evidence

Target x86 libStoneage.so：

- SHA-256: 7c521d9245e2d1668a758402b6975009fd30a7b7b41857d32fc4b51300a29f3d
- Build ID: ab97d1ad35dd9296d54ef8d8c6639511db606333
- ReadBattleMap(int) @ 0xf3700

Observed target behavior：

- filename table contains exactly 220 slots, from battle00.sabex to battle219.sabex;
- BattleMapNo is constrained to 0..219;
- ReadBattleMap reads a 4-byte header and then 1089 cells;
- each cell is assembled as big-endian uint16;
- 1089 = 33 × 33;
- rendering consumes the same 1089 values using two 33-iteration loops.

These are target-binary observations and remain authoritative for the RO0000 APK.

## 2. Public source precedent: _NB_戰鬥地圖優化

Repository:
- Signally190/sking-sacli
- commit 40cb67ef090ebc0cffd57ca947871bdfd0b18331

In system/battlemap.cpp, the source retains the historical BATTLE_MAP_SIZE 400, but introduces a conditional 1089-cell path：

~~~cpp
#ifdef _NB_戰鬥地圖優化
    unsigned short tile[1089];
#endif

#ifdef _NB_戰鬥地圖優化
for (i = 0; i < 1089; i++)
...
for (i = 0; i < 33; i++)
    for (j = 0; j < 33; j++)
...
#endif
~~~

Its Version.h marks the feature as _NB_戰鬥地圖優化 with date 2019.03.05.

This is strong historical evidence that a later StoneAge client line introduced an optimized 33×33 battle-map path while older 20×20 code remained in the same source tree.

Important boundary: this proves a public source precedent, not that the RO0000 APK was built from this exact repository.

## 3. Independent later source precedent

Repository:
- BismarckDD/Stoneage
- commit 2f736808ff4361f5429ee919b718c88fabb60346

Its client/stoneage/game/battle_map.cpp contains 1089-cell storage, the same big-endian byte assembly, and 33×33 rendering loops. The same file still contains a fallback 20×20 branch when the newer path is not selected.

Relevant pattern：

~~~cpp
unsigned short tile[1089];

for (i = 0; i < 1089; i++) {
    c1 = fgetc(fp);
    c2 = fgetc(fp);
    tile[i] = (c1 << 8) | c2;
}

for (i = 0; i < 33; i++) {
    for (j = 0; j < 33; j++) {
        StockDispBuffer(..., tile[cnt++], 0);
    }
}
~~~

This independent source therefore matches the target at three unusually specific points:

1. 1089 unsigned-short cells;
2. big-endian (c1 << 8) | c2 construction;
3. 33×33 rendering loops.

That makes the target's 33×33 interpretation substantially stronger than an isolated disassembly constant, while still not establishing exact source ancestry.

## 4. Filename-table continuity

The older public Android source alrightlook/StoneAgeMobileApp has a battlemapname.h containing the same numbered battle-map family through battle219, although that source's resource names use the older .sab spelling.

The later BismarckDD/Stoneage source uses data/battleMap/battle00.sabex and the same numbered family.

Therefore the 220-slot battle00 ... battle219 namespace is long-lived, while cell geometry is version-dependent.

The practical conclusion for RO0000 is：

~~~
220-slot resource namespace
+
target-specific 33×33 payload geometry
~~~

rather than assuming one geometry from the existence of the 220 filenames.

## 5. What this changes in the investigation

The old 20×20 source should no longer be used as the default decoder for RO0000 .sabex files.

The working decoder contract for target resources is now：

~~~
offset 0x00..0x03 : 4-byte SAB* header
offset 0x04..0x881: 1089 × big-endian uint16
                       ^
                       |
                   0x882 bytes
total minimum      0x886 = 2182 bytes
~~~

This is the minimum byte count implied by the target reader. It is not a claim that every external .sabex file is exactly 2182 bytes; any additional trailing data remains to be checked against actual payload bytes.

## 6. Next evidence layer

The highest-value unresolved step is no longer the grid size. It is obtaining one or more actual target .sabex payloads and matching them against the target reader.

Priority order:

1. Recover target external resource/update catalogue information for battle00..219.
2. Obtain at least one real .sabex payload.
3. Confirm exact 4-byte header bytes.
4. Decode all 1089 values and inspect value distribution.
5. Match decoded tile IDs against the target's real/sprite asset resolver.
6. Compare multiple battle maps to separate background tile identity from special/generated battle backgrounds.
7. Only after byte-level matching, attempt any relationship to server MAP_BATTLEMAP[1..3] values.

No actual .sabex payload bytes are currently inferred or fabricated.

## Evidence boundary

The target APK audit establishes the client-side filename selector, 220-slot namespace, 4-byte header read, 1089-cell read, big-endian cell construction, and 33×33 rendering geometry.

The public source comparisons establish historical precedent for the same 1089-cell implementation pattern.

Neither source comparison is sufficient to prove the exact contents or provenance of the RO0000 target's external .sabex files.

## 7. BattleMapNo selector: server-side origin is now closed

The pinned Fixed-C source closes the upstream selector rule in `BATTLE_getBattleFieldNo(floor, x, y)`:

~~~c
MAP_getTileAndObjData(floor, x, y, &tile[0], &tile[1]);
map[0] = MAP_getImageInt(tile[0], MAP_BATTLEMAP);
map[1] = MAP_getImageInt(tile[0], MAP_BATTLEMAP2);
map[2] = MAP_getImageInt(tile[0], MAP_BATTLEMAP3);
iRet = map[RAND(0, 2)];
return iRet;
~~~

因此 battle-map 編號的目前可證實資料流是：

~~~
encounter floor/x/y
  -> tile[0]
  -> MAP_BATTLEMAP / MAP_BATTLEMAP2 / MAP_BATTLEMAP3
  -> random select one of three map values
  -> battle-field number sent through battle result
  -> Android lssproto receive path
  -> BattleMapNo = received field (only 0..219 accepted)
  -> ReadBattleMap(BattleMapNo)
  -> battle00.sabex ... battle219.sabex
~~~

This means the current evidence does **not** support a simple rule such as `BattleMapNo = floor` or `BattleMapNo = floor % 220`. The local Android client is primarily a consumer of the field number selected upstream.

The remaining closure target is the actual values stored in `MAP_BATTLEMAP`, `MAP_BATTLEMAP2`, and `MAP_BATTLEMAP3` for the target deployment, and then byte-level matching of those values to real `.sabex` files.

## 8. RO0000 deployed `battlemap.txt`: concrete tile/image → BattleMapNo mapping

This is the most important new layer because `ro0000/server/merged-source/gmsv/data/map/battlemap.txt` belongs to the preserved RO0000 deployment snapshot rather than an unrelated legacy repository.

The pinned Fixed-C parser shows that this file is read as follows:

~~~text
$ a b c
imageNumber or imageNumber to imageNumber
~~~

For every numeric image-number entry in the active block, the server stores:

~~~text
MAP_BATTLEMAP  = a
MAP_BATTLEMAP2 = b
MAP_BATTLEMAP3 = c
~~~

and `BATTLE_getBattleFieldNo(floor,x,y)` later chooses one of those three values with `RAND(0,2)`.

### Concrete RO0000 examples

The deployed file contains these mappings:

~~~text
$ 1 2 201
0 to 99
100 to 135
...
10000 to 120000

$ 42 43
534 to 537

$ 45 46 204
538 to 573

$ 218
9424 to 9433
9435
9440
9436 to 9439

$ 219
9434
~~~

The `$ 218` / `$ 219` entries are especially useful: the deployed configuration directly assigns the top battle-map slots to concrete image-number ranges, rather than deriving them from floor numbers.

### Effective candidate semantics

The parser initializes all three candidate slots to the first value before copying additional values. Therefore:

~~~text
$ 42 43       -> [42, 43, 42]
$ 218         -> [218, 218, 218]
$ 45 46 204   -> [45, 46, 204]
~~~

So a two-value block is not a simple 50/50 pair: the current parser gives the first value two of the three random slots.

### Configuration coverage observed

A semantic parse of the current RO0000 file finds:

- 74 active `$` mapping blocks.
- 199 distinct BattleMapNo values referenced by those blocks.
- 21 BattleMapNo values are currently unreferenced by `battlemap.txt`.
- 61 blocks provide three explicit candidate values, 4 provide two, and 9 provide one.
- Image-number coverage reaches the large range beginning at 10000 and ending at 120000; the current semantic parser counts 119,923 actual image-number assignments (inclusive valid ranges only).

These counts describe the current file contents and parser semantics. An unreferenced BattleMapNo is not proof that its `.sabex` payload is missing; it only means no active numeric mapping to that slot was found in this configuration file.

One malformed-but-present range is `3137 to 1349`. The Fixed-C loop uses `for( i = iFirst; i <= iLast; i++ )`, so this reversed range produces zero assignments. It is therefore retained as an audit finding rather than normalized into a forward range.

### One explicit duplicate assignment

The file ends with:

~~~text
$ 200
60317
~~~

Earlier in the file, image number `60317` falls under the `$ 1 2 201` range. The Fixed-C parser itself detects a duplicate setting and reports an error before writing the later value, so the final loaded value becomes `200` despite the duplicate warning.

This is useful evidence that `battlemap.txt` is executable configuration with actual override/error-detection behavior, not merely documentation.

## 9. Revised RO0000 battle-map chain

The strongest end-to-end chain we can now document is:

~~~text
RO0000 battlemap.txt
  -> encounter tile/image number
  -> MAP_BATTLEMAP / MAP_BATTLEMAP2 / MAP_BATTLEMAP3
  -> RAND(0,2)
  -> selected BattleMapNo
  -> battle field number delivered to Android client
  -> target BattleMapNo clamp to 0..219
  -> BattleMapFile[BattleMapNo]
  -> battle00.sabex ... battle219.sabex
  -> 4-byte SAB* header + 1089 big-endian uint16 cells
  -> 33×33 tile rendering
~~~

This closes the selector/data lineage much further than the previous target-only analysis. The remaining gap is now byte-level payload identity: obtaining one or more actual target `.sabex` files and proving which tile IDs they contain.

## 10. Reproducible selector audit

The parser has now been captured as `tools/audit_ro0000_battlemap_selector.mjs`, with its current result stored in `data/generated/stoneage_ro0000_battlemap_selector_audit.json`. The README maintenance workflow runs this audit before refreshing the project status, so future changes to `battlemap.txt` will be regression-visible.

## 11. Server/client slot-count closure

The pinned Fixed-C `battle.h` defines `BATTLE_MAP_MAX 219`. `BATTLE_CreateVsEnemy()` rejects a selected field number outside `0..219` and falls back to `RAND(0, BATTLE_MAP_MAX)`.

This independently closes the 220-slot relationship:

~~~text
server BATTLE_MAP_MAX = 219
valid field numbers     = 0..219
target BattleMapFile    = 220 entries
target last filename    = battle219.sabex
~~~

The earlier target-binary observation that `ReadBattleMap()` resets an out-of-range filename index to zero is therefore consistent with the server's 0..219 field-number domain.

This does not prove that every one of the 220 slots is active in the deployed `battlemap.txt`: the current RO0000 configuration references 199 distinct slots, while 21 slots have no active numeric mapping in that file. Those unreferenced slots must be treated as valid namespace members whose runtime usage is unresolved, not as missing files.

## 12. Receive-side field contract cross-check

An independent later StoneAge client source (`BismarckDD/Stoneage`) shows `lssproto_EN_recv(result, field)` applying the same 220-slot domain: if `field < 0` or `BATTLE_MAP_FILES <= field`, it resets `BattleMapNo` to zero; otherwise it assigns `BattleMapNo = field`.

Together with `BATTLE_MAP_FILES 220`, this mirrors the target APK's observed client-side field handling and provides a source-level cross-check for the receive contract:

~~~text
EN result > 0
  -> field in [0,219]
  -> BattleMapNo = field
  -> ReadBattleMap(BattleMapNo)
~~~

This is still a cross-source validation rather than direct proof that the RO0000 APK was compiled from that repository.
