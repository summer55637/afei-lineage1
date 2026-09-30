# Persistent State Schema

更新日期：2026-09-30

本專案現在開始建立新的 canonical persistent state。它是與 UI 分離的資料層，不重新搬回舊 game.js。

## Source boundary

- Fixed C source: gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- 固定 C 的 legacy save schema 已研究到 schema 30；新 canonical schema 從 1 開始，legacy 版本只作 provenance，不混成同一版本號。
- Profession skill 固定保留 26 slots；舊 source save 的 skill0..skill25 不 compact。
- Player item slot 固定 24 slots；aggregate inventory 不反推歷史 slot。
- Pet state 分開保存 petBox、team、activePetId；不因缺失資料自行創造寵物。
- Pet AttackMagic 的 source-backed 四屬性熟練度保留 sourceAttackMagicLv[4] / sourceAttackMagicExp[4]。

## State sections

| 區域 | 內容 | 層級 |
| --- | --- | --- |
| player | id/name/level/exp/transmigration/hp/mp/stats/luck/charm/duelPoint/gold | source-backed fields + structural defaults；Gold 受 Item/Economy source cap 驗證 |
| player.profession | class/level/skillPoint/skills[26] | fixed-C source contract |
| inventory | playerItemSlots[24]/piles/itemRuntime | source-backed structure |
| equipment | sourceSlotRefs | 不推導 slot 意義 |
| pets | petBox/team/activePetId + Pet source fields | source-backed structure |
| quests/events/titles | mission/daily/event/title state | source-data driven；未閉合內容保持 opaque |
| world | floor/x/y/savePoint | source route state |
| idle | enabled/mode/routeId/offline accounting | 放置版產品層，不冒充 fixed C |
| battleSettings | strategy/sourceParity | 放置版設定層，未有 evidence 的策略不預設 |

## Migration policy

legacy schema 30 目前只做 known-field copy。可辨識欄位會搬入 canonical state；未知 top-level keys 不猜語義，而是列入 migration.preservedUnknownKeys。

Migration 不會根據缺失 slot 猜曾經裝備什麼，也不會依 team / petBox 缺失資料自動創造寵物，更不會補 unresolved item / quest ID。

## Validation

src/stoneage_persistent_state.mjs 提供 fresh / normalize / validate。

目前固定硬結構：profession skills = 26 slots；player item slots = 24 slots。Item / Economy runtime 另外驗證 Gold 不超過 fixed-C maxGold，以及 backpack 9–23 的 existing-item reference 必須存在。

V3.73 再加入 canonical container validation：equipment.sourceSlotRefs、quests.missions/daily、events、titles、battleSettings.strategy/sourceParity 必須保持 object shape；world position 的 floor/x/y 在存在時必須為整數；offline accruedSeconds 不得超過 accrualCapSeconds。這些內容的內部語義仍保持 opaque，不因 schema 驗證而猜測 source 規則。

Regression：tools/check_persistent_state_schema.mjs

Generated contract：data/generated/stoneage_persistent_state_schema.json

下一階段會在這個 state contract 上接 Idle Loop：map position → encounter roll → battle result → reward transaction → supply/death → save/offline resume。
