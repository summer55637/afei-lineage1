# V3.44 Persistent State ↔ Save Envelope Join

更新日期：2026-09-30

V3.44 不新增 playable HTML，而是把 canonical Persistent State v1 與 Save Envelope v1 做一次完整的 headless contract join。

## 本輪鎖定

- Persistent State schema 保持 v1；fixed-C legacy save schema 30 只作 migration provenance。
- Profession skills 固定 26 slots；player item slots 固定 24 slots。
- Player / inventory / equipment / pets / quests / events / titles / world 以及 idle / battleSettings 均須能進入 save payload 並經 hash → parse → canonical validation round-trip。
- Pet team / activePetId 必須保持對 petBox 的 reference integrity。
- Backpack slot 9–23 的 existing item reference 仍由 Item/Economy contract 驗證。
- legacy schema 30 的 unknown top-level key 維持 preservedUnknownKeys，不猜語義。
- revision 仍由 Save Envelope commit guard 控制；save layer 不產生 battle、reward RNG、offline reward、死亡或補給結果。

## 邊界

這個 join regression 只驗證資料可以安全地保存與重新載入，不代表 idle battle policy 已經閉合，也不把 compatibility-only 的 changeevent alias 升格成 pinned source module。

## Regression

`tools/check_v344_persistent_state_save_join.mjs`

對應 workflow：

`.github/workflows/check-v344-persistent-state-save-join.yml`

在重新建立唯一 playable HTML 前，Persistent State 與 Save Envelope 必須維持這條單一 contract boundary。
