# First idle route catalog

更新日期：2026-09-30

這份 catalog 把已驗證的 start route、world exit 與 encounter path 接成「可以交給 Idle Loop 的路線骨架」。

## 路線狀態

| hometown | entry | encounter | 狀態 |
| ---: | ---: | ---: | --- |
| 0 | 1000 → 100 | Encounter 65 | path closed；battle policy pending |
| 1 | 2000 → 100 | Encounter 28 | path closed；battle policy pending |
| 2 | 3000 → 200 | Encounter 91 | path closed；一個 landing point 不可走 |
| 3 | 4000 → 200 | — | source blocked before portal |

### Samugiru

1000→100 的兩組 portal 都有 source path。第一組最短為 120 步到 portal origin，再 71 步到 Encounter 65；第二組為 104 + 146。

### Marinasu

2000→100 的兩組 portal 都可達；進入 floor 100 後的 landing points 直接落在 Encounter 28 的 unconditional rectangle。

### Jaja

3000→200 的兩組 portal 都至少有可用 landing。第二組六個 landing 中 `(587,318)` 被 fixed-C walkability 判定為不可走，因此這個點不加入 idle movement target。

### Karutarna

4000→200 的兩組 source portal origins 與出生 direct landing component disconnected，因此目前不能把它建立成正式 idle route。這裡不人工加橋、不手動 teleport。

## 放置戰鬥與待定產品規則

基礎戰鬥策略 v1 已接入 Browser State Controller：待命中的玩家角色使用普通攻擊，目標依來源預設隨機選取；狀態阻擋或沒有可攻擊目標時使用 wait。寵物沿用 Fixed-C 預設普通攻擊。

這是目前明確採用的最小策略，不代表已完成整場自動戰鬥。Battle result 仍由外部 runtime 注入；技能／道具使用、補血門檻、捕捉、自動換寵、背包滿、死亡恢復、offline accrual、route rotation 仍各自待定。

Generated：data/generated/stoneage_first_idle_route_catalog.json
