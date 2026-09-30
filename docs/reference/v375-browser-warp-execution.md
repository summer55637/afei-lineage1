
# V3.75 Browser Warp execution

更新日期：2026-10-01

V3.75 將已 source-closed 的起點 Warp NPC 接到唯一 Browser State Controller，形成第一段真正的 world position transfer。

## Fixed-C source chain

固定 source：
gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

本輪鎖定：
gmsv/data/npc/genout/npcgen.template
→ templatename=npcgen_warp
→ functionset=Warp

以及：
gmsv/src/npc/npc_warp.c
→ NPC_WarpWatch()
→ player CHAR_ACTWALK 走到 Warp NPC 的同一格
→ NPC_WarpWarpCharacter()
→ 讀取標準 floor|x|y
→ CHAR_warpToSpecificPoint()

因此 Browser runtime 不使用 NPC talk、facing 或距離對話 gate；它要求 player/state 的 world position 已經落在該 Warp NPC 的 exact source cell，再執行 source destination。

## V3.75 production closure

固定起點 floor 共 8 個 source Warp NPC instances：

- 1006 → 1000： (10,20) → (98,44)、(10,21) → (98,45)
- 2006 → 2000： (20,21) → (56,48)、(21,21) → (57,48)
- 3006 → 3000： (20,21) → (90,60)、(21,21) → (90,60)
- 4006 → 4000： (10,20) → (80,90)、(10,21) → (80,91)

catalog generator 只接受標準 npcgen_warp|floor|x|y。FREEMORE 或非標準條件目的地不會在本輪被猜測解析。

## Browser transaction boundary

Browser Warp 成功後只寫：
state.world.position = { floorId, x, y }

並透過既有：
commitSave() → Save Envelope → parseAndValidateSaveEnvelope()

把 revision 增加一次。

本輪沒有直接修改：
- player gold / inventory / pet / quest / event
- savePoint
- battle / encounter RNG
- NPC dialogue state
- HTML playable entrypoint

## Fail-closed

以下情況均拒絕：
- catalog fixed source 不一致
- NPC 不是 npcgen_warp
- source path#blockIndex 無 binding
- NPC 與 source origin 不一致
- player 不在 Warp NPC 同一格
- 非標準 / invalid Warp target
- expectedRevision 不一致
- Save Envelope 驗證失敗

V3.75 是 Browser world-transfer adapter，不宣稱完整 server-side Warp 副作用 parity。
