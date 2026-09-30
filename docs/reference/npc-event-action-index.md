# NPC Event / Action Source Index

更新日期：2026-09-30

## 目的

這份索引把 pinned fixed C 的 NPC event-action DSL 與全部 NPC data 做交叉掃描，確認 NPC 腳本實際會改變哪些遊戲狀態。

它仍是 source research data，不直接建立 playable quest / economy runtime。

## 掃描結果

- NPC data files：3,960
- fixed-C event action keys：38
- 有實際資料命中的 action keys：16
- action key matches：4,860

| Action | Matches |
|---|---:|
| DelItem | 1,691 |
| DelPet | 388 |
| AddItem | 321 |
| GetRandItem | 310 |
| DelGold | 264 |
| AddExps | 36 |
| AddGold | 36 |
| Event_End | 27 |
| Event_Now | 23 |
| AddPet | 17 |
| PROFESSION | 8 |
| EvClr | 4 |
| CHANGEBBI | 2 |
| NewDelPet | 1 |
| SetLastTalkelder | 1 |

NPC data 中的條件 token：

- FREE：1,731
- ENDEV：1,962
- NOWEV：982
- ITEM：2,379
- GOLD：1
- LV：3
- TRANS：286
- PET：340

另外掃出：

- AddItem numeric references：310 種
- DelItem numeric references：719 種
- GetItem numeric references：582 種
- ITEM numeric references：1,024 種

## 重要意義

這證明世界的任務與經濟資料主要不是集中在單一 mission.txt。

真正的資料鏈更接近：

NPC create → template → functionset → arg/event DSL → condition → action → item/pet/gold/event state

因此未來要做到完整世界，應優先解析 NPC arg / no-extension script，而不是只製作一張 NPC 名稱表。

## 下一步

接下來把三種 source layer 串起來：

NPC Event DSL → item references → itemset6 → quest/event state

並優先找出：

- 新手流程
- 城鎮商店
- 治療／存點
- 道具取得
- 任務開始／完成
- 傳送條件
- 寵物取得／交付
- 職業／轉生