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
- inner-loop horizontal increment = +0x20 = +32 pixels;
- inner-loop vertical increment = -0x17 = -23 pixels;
- between outer-loop rows, position advances by +0x20 / +0x17 = +32 / +23 pixels.

The target starts the position accumulator at (-450, 350). For row `r` and column `c`, its unnormalized target coordinate is therefore:

```text
x = -450 + 32 * (r + c)
y =  350 + 23 * (r - c)
```

The Web full-map preview centers this same lattice around cell (16, 16) and fits the resulting sprite bounds to the supplied canvas; its placement step remains 32 / 23, not 32 / 24.

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

### Cross-check: server candidates versus Android SABEX index

The current workflow now regenerates the RO0000 server `battlemap.txt` selector audit from source, then compares every effective candidate with the target APK's `BattleMapFile` table size in both packaged ABIs. The target table is 112,640 bytes with a 512-byte filename stride, yielding 220 slots (0–219). The current server configuration references 199 distinct candidate numbers, all within that target range; 21 Android slots are not selected by the current configuration.

The cross-check is stored in `data/generated/stoneage_ro0000_android_battlemap_selector_crosscheck.json`. It also retains the source audit's reversed interval and duplicate image assignment as warnings. The reversed `3137 to 1349` interval produces no iterations in the pinned Fixed-C parser's `for (i = first; i <= last; ++i)` loop; this audit does not silently rewrite source configuration.

This closes the numeric selector-to-filename-table compatibility check only. It does not establish that the corresponding `battleNNN.sabex` payload bytes exist, that a specific selector is exercised at runtime, or that its pixels match the original renderer.

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

## 11. Target resource table domains and shard separation

The target x86 binary now allows the image-ID and sprite-animation namespaces to be separated precisely.

### Image / Real resource tables

- `bitmapnumbertable` is 400,000 bytes = 100,000 uint32 entries. `realGetNo(imageId)` accepts image IDs below 100,000 and returns `bitmapnumbertable[imageId]`.
- `adrnbuff` is 48,000,000 bytes = 600,000 records × 80 bytes.
- `Realbinfp` is 2,400,000 bytes = 600,000 FILE* slots, indexed by the same graphic-number domain.

Therefore the client has two different ID domains:

~~~text
image/bmp number : 0..99,999
        ↓
bitmapnumbertable
        ↓
graphic number   : 0..599,999
        ↓
adrnbuff + Realbinfp
~~~

A SABEX cell is a uint16, so its raw range is 0..65,535. This means every raw SABEX cell value is inside the target `realGetNo()` image-ID admission range; values do not need widening before entering the resolver.

The rendering gate is separate: target `StockDispBuffer()` rejects `bmpNo <= 99`, while values above 99 enter `realGetNo()` and then `realGetPos()`. Thus low SABEX cell values should be treated as non-drawable/special codes in a target-faithful renderer rather than automatically being looked up as ordinary graphics.

### Per-directory resource shards

`loadResources()` calls `InitPteernSeparationBin("path", true)`. The target function recursively scans the resource tree and, for qualifying directories, `LoadSprbin()` constructs the four resource paths:

~~~text
%s/adrn.bin
%s/real.bin
%s/spradrn.bin
%s/spr.bin
~~~

`AdrnInit()` records the current `MaxAdrnID` into `nextMaxAdrnID` before importing a shard. Each decoded 80-byte ADRNBIN record then has its graphic number shifted by that base before being stored into `adrnbuff` and `Realbinfp`; its nonzero `attr.bmpnumber` is entered into `bitmapnumbertable` against the shifted graphic number.

This means the target client does not treat all `adrn.bin` files as an independent zero-based namespace. They are merged into one global graphic-number space using the running `MaxAdrnID` offset.

### Sprite animation namespace is separate

`InitSprBinFileOpen()` reads a 12-byte SPRADRN entry (`sprNo`, `offset`, `animSize` plus ABI padding), seeks into `spr.bin`, reads 12-byte animation headers and 10-byte frame records, and adds the same `nextMaxAdrnID` base to each frame's bitmap number before storing it in `SpriteData`.

The target `SpriteData` allocation is 320,000 bytes = 40,000 entries, matching the public client's `mxSPRITE 40000` namespace.

Therefore:

~~~text
SABEX battle tile
    ↓
StockDispBuffer
    ↓
realGetNo
    ↓
bitmapnumbertable / ADRNBIN / Realbin

sprite animation
    ↓
SpriteData / spradrn.bin / spr.bin
    ↓
frame BmpNo + nextMaxAdrnID
~~~

These are related through the shared graphic-number space, but `spr.bin` is not the source of SABEX's 33×33 tile grid.

All numeric layout claims above are recorded in `data/generated/stoneage_ro0000_android_native_resource_layout.json`.

## 12. Target: battle tile → actual surface rendering

Using the retrieved target x86 ELF, the previously established SABEX/image-index chain can now be extended through the renderer.

`StockDispBuffer()` receives the decoded SABEX cell as `bmpNo`. For values above the target `CG_INVISIBLE` threshold 99, it calls `realGetNo()` and `realGetPos()` and stores the resolved graphic number in the display buffer.

`PutBmp()` later calls `LoadBmp(graphicNo)` before rendering a display entry. The target `LoadBmp(int)` @ `0x2ef220` behaves as follows:

~~~text
LoadBmp(graphicNo)
  -> if cached surface exists: reuse
  -> otherwise realGetImage(graphicNo, ...)
  -> on success store decoded width/height
  -> AllocateBmpToSurface(graphicNo)
~~~

`realGetImage()` @ `0x362fd0` reads the 80-byte `adrnbuff[graphicNo]` record, obtains the associated `Realbinfp[graphicNo]`, seeks to `adder`, reads `size` bytes, then calls target `decoder()`.

`AllocateBmpToSurface()` @ `0x2eeb80` then turns the decoded image metadata into the target surface representation. `PutBmp()` subsequently passes the surface information to the renderer.

Thus the target battle-map path is now closed at the rendering boundary:

~~~text
battleNNN.sabex
  -> 1089 × uint16be image IDs
  -> StockDispBuffer
  -> realGetNo
  -> bitmapnumbertable
  -> global graphicNo
  -> LoadBmp
  -> realGetImage
  -> ADRNBIN adder/size + Real FILE*
  -> decoder (RD / gG)
  -> decoded pixels + width/height
  -> AllocateBmpToSurface
  -> PutBmp renderer
~~~

This proves the SABEX values are not merely metadata: when they are ordinary drawable IDs, they enter the same target image/surface pipeline used by the actual renderer.

The machine-readable closure is stored in `data/generated/stoneage_ro0000_android_battle_render_chain.json`.

Actual RO0000 `.sabex`, `adrn.bin`, and `real.bin` bytes remain outside the repository, so this closes the target code path but not a concrete map's pixel output.

## 13. Browser-side full battle-map preview

The browser runtime now has a dedicated SABEX decoder in `src/stoneage_sabex_decoder.mjs`; it accepts `Uint8Array`, `ArrayBuffer`, and typed-array views without relying on Node's `Buffer` or importing a parser from `tools/`.

`renderBattleSabexPreviewAsync()` in `src/stoneage_tile_presentation.mjs` accepts a complete target SABEX byte array and a ready authorized client asset presentation. It:

- decodes the 4-byte header and 1089 big-endian uint16 cells;
- skips IDs `<= 99` at the same target render gate used by `StockDispBuffer()`;
- resolves each distinct drawable image ID once through ADRNBIN → Real → RD/gG → SAP/RGBA;
- submits cells in target row-major order using the target's horizontal 32 / vertical 23 lattice;
- auto-fits decoded graphic bounds to the supplied canvas by default;
- returns `partial` plus unresolved image IDs when any drawable cell lacks a resolvable graphic, rather than substituting placeholder terrain.

The pure `targetBattleCellPosition(row,col)` helper exposes the centered equivalent of the target's positional deltas. The integration test uses a synthetic SABEX byte array and synthetic authorized assets only; it proves decoder-to-canvas wiring, not pixel parity with unavailable production resource bytes.

