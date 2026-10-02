# RO0000 Android APK: Map Protocol and Local Cache Audit

更新日期：2026-10-02

## 目的

用 target APK 的 x86 `libStoneage.so` 直接確認：

```
server map response
  -> lssproto_S_recv
  -> setMap / createMap
  -> local map/%d.dat

server map rectangle response
  -> lssproto_M_recv
  -> tile / parts / event arrays
  -> writeMap
  -> local map/%d.dat
```

此文件優先記錄 target binary evidence；公開 Android client source 僅作交叉校驗，不覆蓋 target evidence。

## Source identity

- APK: `ro0000/client/android/冰河石器-隐盟.apk`
- APK SHA-256: `6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c`
- x86 `libStoneage.so`: `7c521d9245e2d1668a758402b6975009fd30a7b7b41857d32fc4b51300a29f3d`
- x86 ELF Build ID: `ab97d1ad35dd9296d54ef8d8c6639511db606333`

## 1. S protocol: map initialization

Target symbol:

```
lssproto_S_recv(int, char*)
```

The dispatch examines the first byte of the received S message. The target client contains a map-initialization branch whose direct call sequence is:

```
getIntegerToken(data, '|', 1)
getIntegerToken(data, '|', 2)
getIntegerToken(data, '|', 3)
getIntegerToken(data, '|', 4)
getIntegerToken(data, '|', 5)

setMap(fl, gx, gy)
createMap(fl, maxx, maxy)
```

The register/stack mapping at the direct call sites confirms:

- token 1 -> `fl`
- token 2 -> `maxx`
- token 3 -> `maxy`
- token 4 -> `gx`
- token 5 -> `gy`

Therefore the target APK itself establishes the same map-initialization contract represented by the readable Android source:

```
S|C|<floor>|<maxx>|<maxy>|<gx>|<gy>
```

with the leading dispatch byte / delimiter handling retained separately by the native protocol parser.

The direct native call sites are:

- `setMap(int,int,int)` @ `0x2118d0`
- `createMap(int,int,int)` @ `0x20b690`
- caller `lssproto_S_recv) @ `0x3fa900`

## 2. Local map-cache path

The target binary's map cache uses the literal relative path:

```
map/%d.dat
```

Both `createMap`, `readMap`, and `writeMap` use this same path template.

This is a target-specific finding. A separate public Android source snapshot may use an absolute storage path; that difference is not used to rewrite the target APK's path semantics.

## 3. createMap: cache file structure

Target `createMap(int floor, int width, int height)` creates/opens the map cache for the given floor and writes:

| Offset | Size | Stored content |
|---:|---:|---|
| 0 | 4 | first dimension |
| 4 | 4 | second dimension |
| 8 | 2 × A × B | first 16-bit plane |
| 8+2AB | 2AB | second 16-bit plane |
| 8+4AB | 2AB | third 16-bit plane |

The total initialized layout is therefore:

```
8 + 6AB bytes
```

The target `readMap` later reads the same three planes in the same order.

## 4. M protocol: rectangle update

Target symbol:

```
lssproto_M_recv(int fd, int fl, int x1, int y1, int x2, int y2, char* data)
```

The target function:

1. extracts protocol token 1 as a display/floor metadata string;
2. extracts token 2 into the tile string;
3. extracts token 3 into the parts string;
4. extracts token 4 into the event string;
5. parses each array as comma-separated values using `a62toi`;
6. stores all three arrays as 16-bit values;
7. calls `writeMap(fl, x1, y1, x2, y2, tile, parts, event)`.

The target call at `0x3f7d4c` is a direct call to:

```
writeMap(int, int, int, int, int,
         unsigned short*, unsigned short*, unsigned short*)
```

with the three locally built arrays passed in order:

```
tile -> first pointer
parts -> second pointer
event -> third pointer
```

The target parser uses comma `0x2c` as the array delimiter and passes the numeric cells through `a62toi`, matching the readable Android implementation.

## 5. Plane semantics: target-side closure

The target `drawMap()` calls:

```
readMap(..., &tile[0], &parts[0], &event[0])
```

and then uses:

- `tile[]) for normal tile rendering;
- `parts[]) through `realGetNo`, `realGetPos`, and `realGetWH` for placed map parts;
- `event[]) as an independent event/state plane.

The target `readHitMap()` also consumes all three buffers.

Together with the direct `M_recv → writeMap(tile,parts,event)` call, this establishes the primary client-side plane order:

```
plane 1 = tile
plane 2 = parts
plane 3 = event
```

This is now target-binary evidence rather than only a cross-source assumption.

## 6. Read/write persistence

Target `writeMap()`:

- opens `map/%d.dat`;
- reads the stored dimensions;
- clips the requested rectangle against the stored map bounds;
- writes the rectangle into each of the three planes at their corresponding offsets;
- updates the event plane with client-side visibility/read flags:
  `MAP_SEE_FLAG | MAP_READ_FLAG`;
- updates the current in-memory event window through `setEventMemory` when the written rectangle overlaps the active map area.

Target `readMap()` performs the inverse three-plane reads and initially clears all three destination buffers.

Therefore the cache is a persistent client-side mirror of received map rectangles, not a standalone authoritative map database.

## 7. Event-plane consequence

Because `writeMap()` ORs visibility/read bits into the event plane, the cached third plane is not a pure copy of server event values after local writes.

This matters for reconstruction:

- server event payload and
- Android cached event state

must remain separate evidence concepts.

It is incorrect to interpret every bit in a persisted `map/%d.dat` event cell as a server-authored event value.

## 8. HitMap relationship

The target client has a distinct derived `hitMap` pipeline:

```
tile + parts + event
        |
        v
   readHitMap()
        |
        v
     hitMap[]
        |
        v
   checkHitMap()
```

The global `hitMap` symbol is 2,738 bytes in both target ABIs:

```
2738 / 2 = 1369 cells = 37 × 37
```

This is a client-side derived movement/query structure. It must not be treated as a raw server tile array.

The previously audited target behavior remains:

- ordinary in-window `hitMap == 1` is the blocked/hit result for `checkHitMap`;
- `hitMap == 2` is a distinct derived state and is not returned as a hit by that query;
- out-of-window coordinates return true;
- `pc.skywalker` bypasses the normal hit-map rejection path.

These are client semantics, not a replacement for server Fixed-C movement rules.

## 9. Closure status

This round closes the Android map transport/cache chain to the following level:

```
S_recv
  -> floor/dimensions/position parse
  -> setMap
  -> createMap
  -> map/%d.dat

M_recv
  -> tile string
  -> parts string
  -> event string
  -> a62toi arrays
  -> writeMap
  -> map/%d.dat

map/%d.dat
  -> readMap
  -> tile / parts / event
  -> drawMap + readHitMap
```

Still unresolved at APK-resource level:

- actual external map resource files served by the update system;
- exact contents of `path/map4/real.bin`;
- actual `s/real.bin`, `adrn.bin`, `spr.bin`, `spradrn.bin` payloads;
- complete semantics of every tile/parts/event numeric value;
- exact server-side update response bytes for this client installation.

## Cross-source corroboration

The readable Android implementation in `alrightlook/StoneAgeMobileApp` contains the same:

- `S` map initialization token order;
- `M` rectangle update signature;
- `tile / parts / event` arrays;
- `writeMap(fl,x1,y1,x2,y2,tile,parts,event)` call shape.

The target APK's direct native call sites independently reproduce these structures, so the target evidence does not depend on the public source for the primary closure.
