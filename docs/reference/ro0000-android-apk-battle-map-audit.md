# RO0000 Android APK: Battle Map Resource Audit

更新日期：2026-10-02

## Target identity

- APK: `ro0000/client/android/冰河石器-隐盟.apk`
- APK SHA-256: `6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c`
- Target x86 `libStoneage.so`: `7c521d9245e2d1668a758402b6975009fd30a7b7b41857d32fc4b51300a29f3d`
- x86 Build ID: `ab97d1ad35dd9296d54ef8d8c6639511db606333`

## 1. Battle map filename table

The target native binary contains a static filename table beginning at the exported `BattleMapFile` object.

Verified table shape:

- `BattleMapFile` size = `0x1b800` = 112,640 bytes.
- Entries are spaced by `0x200` = 512 bytes.
- `112640 / 512 = 220` entries.
- Entry 0 is `data/battlemap/battle00.sabex`.
- Entry 219 is `data/battlemap/battle219.sabex`.

Therefore the target client has exactly 220 indexed battle-map filename slots:

```
battle00.sabex
...
battle219.sabex
```

The APK archive itself does not contain these `.sabex` files, so the filename table is a client-side resource locator, not proof that the payload bytes are bundled inside the APK.

## 2. Battle map number admission

Target symbol:

```
lssproto_EN_recv(int,int,int)
```

The function receives `result` and `field`. On a positive battle/encounter result it writes the received `field` into the client battle-map selector after this bound check:

```
field < 0  -> BattleMapNo = 0
field >= 220 -> BattleMapNo = 0
otherwise -> BattleMapNo = field
```

The exact x86 comparison uses the literal `0xdc` (220).

Thus the target client itself establishes:

```
EN_recv(..., field)
        |
        v
BattleMapNo = clamp-to-[0,219] field
        |
        v
ReadBattleMap(BattleMapNo)
```

The same receive function independently sets encounter/duel-related flags from `result`, but those flags are not needed to establish the resource lookup.

## 3. ReadBattleMap file selection

Target symbol:

```
ReadBattleMap(int) @ 0xf3700
```

The function:

1. clamps `no >= 220` to `0`;
2. stores the selected number in `BattleMapNo`;
3. indexes `BattleMapFile[no]`;
4. calls `fopen(..., "rb")` on that filename.

Therefore the target client does not synthesize a battle-map filename from the number at this point; it selects one of the 220 pre-populated filename strings.

## 4. Target battle-map file header

After opening the selected file, target code:

1. reads 4 bytes into a header buffer;
2. terminates it with NUL;
3. searches the header for the substring `"SAB"`.

The inspected target path does not turn a failed `strstr` into a hard return; the header check is therefore an observed validation/diagnostic step, not a proven mandatory reject gate.

## 5. Major version-specific finding: 33 × 33

This is the important distinction from the older public client source.

The target x86 `ReadBattleMap()` loops until its counter reaches:

```
0x441 = 1089
```

and stores each cell as a 16-bit value.

```
1089 = 33 × 33
1089 × 2 = 2178 bytes of tile data
+ 4-byte header
= 2182-byte minimum SABEX payload
```

The same function later has two nested loops whose bounds are both the literal `0x21` (33), and those loops consume the loaded 1089-cell array for rendering.

Therefore the target APK's battle-map geometry is:

**33 × 33 cells, 16-bit tile number per cell.**

This is target-binary evidence.

### Important cross-version mismatch

The readable `alrightlook/StoneAgeMobileApp` source uses:

```
#define BATTLE_MAP_SIZE 400
```

and its `ReadBattleMap()` reads 400 16-bit cells, corresponding to a 20 × 20 layout.

Do not silently apply that 20 × 20 layout to this RO0000 Android APK. The target binary is unambiguous about the 1089-cell / 33 × 33 layout.

## 6. Target cell byte order

For each of the 1089 cells, target code performs:

```
c1 = fgetc(fp)
c2 = fgetc(fp)
tile[i] = (c1 << 8) | c2
```

Therefore each stored cell is read as a **big-endian 16-bit unsigned tile value**.

This is stronger than only identifying a 2-byte cell size; the target binary explicitly constructs the value from high byte then low byte.

## 7. Target rendering geometry

After loading the 33 × 33 cell array, the target rendering path uses:

- inner loop count = 33;
- outer loop count = 33;
- horizontal increment = 32 pixels;
- vertical increment = -24 pixels within each diagonal row;
- between rows, position advances by +32 / +24.

The loaded values are ultimately passed as tile graphic numbers into `StockDispBuffer`.

Thus the `.sabex` payload is not merely an indexed lookup table: these 16-bit values are consumed directly as battle-scene tile/graphic IDs.

## 8. Relation to current RO0000 battlefield source

The existing project evidence already records the pinned Fixed-C battle-map manifest as:

- declared battle-map count = 220;
- assigned battle-map definitions = 199;
- source file = `gmsv/data/map/battlemap.txt`.

Fixed-C `BATTLE_getBattleFieldNo(floor,x,y)` selects among the three per-tile battle-map candidates (`MAP_BATTLEMAP`, `MAP_BATTLEMAP2`, `MAP_BATTLEMAP3`) and chooses one with `RAND(0,2)`.

This gives the following source-side chain:

```
floor/x/y
  -> map tile descriptor
  -> MAP_BATTLEMAP[1..3]
  -> RAND(0,2)
  -> battlefield number
```

and the target Android client receives that resulting battlefield number as `field` in `lssproto_EN_recv`, clamps it into 0..219, then opens the corresponding `.sabex`.

This is a useful cross-layer correspondence, but the Android `.sabex` payload is still a client resource and should remain a separate evidence layer from the server LS2MAP/mapset files.

## 9. What is now closed

The APK battle-map resource path is now closed to this level:

```
server encounter/battle field number
        |
        v
lssproto_EN_recv(..., field)
        |
        v
BattleMapNo 0..219
        |
        v
BattleMapFile[BattleMapNo]
        |
        v
data/battlemap/battleNNN.sabex
        |
        v
4-byte SAB* header
        |
        v
1089 × uint16 cells
        |
        v
33 × 33 battle scene
        |
        v
StockDispBuffer tile rendering
```

## 10. Still unresolved

- Actual `.sabex` payload bytes for battle00..battle219.
- Which specific `.sabex` files are delivered by the APK's hot-resource patch system versus pre-existing external storage.
- Per-file MD5/URL metadata for battle-map resources in `list.dat`.
- Exact semantics of every 16-bit battle tile ID and its mapping to `real.bin`/sprite assets.
- Exact source/version that introduced the target's 33 × 33 format.
- Any relationship between target `.sabex` cell IDs and server `MAP_BATTLEMAP` numeric IDs beyond the shared battlefield-number selector.

No unobserved resource bytes are being inferred.

## Cross-source comparison

The older public Android source confirms the same filename family and `SAB` header convention, but its 20 × 20 / 400-cell constant is treated only as a historical version comparison.

The current RO0000 target binary takes precedence for the target APK's actual resource layout.
