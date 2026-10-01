# Endpoint Setup Config Audit

更新日期：2026-10-01

## 目的

把 VM 一鍵端 `gmsv/setup.cf` 的高影響設定與 pinned fixed-C 做同一份 machine-checkable audit。

這份 audit 只保存非敏感的 gameplay/data-path 設定，不保存 password、IP、port 或帳號伺服器憑證。

## 已確認的 endpoint variant

| Key | Endpoint | Fixed-C |
|---|---|---|
| `battleexp` | `1` | `100` |
| `TRANS` | `0` | `1` |
| `NPRIDE` | `0` | `3` |
| `GOLD` | `99999` | `30000` |
| `ITEM1` | `32003` | `24114` |
| `ITEM2..ITEM15` | endpoint 額外配置 14 個 | 未配置 |
| `itemset6file` | `data/itemset6.csv` | `data/itemset6.txt` |
| `EXPSHARE` | endpoint 未配置 | `100` |

其他核心資料路徑如 `mapdir`、`maptilefile`、`battlemapfile`、`encountfile`、`enemyfile`、`enemybasefile`、`groupfile`、`npcdir`、`profession` 等目前與 fixed-C 相同。

## 解讀

這些差異是實際 endpoint deployment configuration evidence，不應直接覆蓋 fixed-C semantics。

例如 endpoint `battleexp=1` 只能表示該 deployment 的設定值是 1；真正 EXP 計算仍需確認 server runtime 如何讀取與套用。相同原則適用於 `TRANS`、`NPRIDE`、`GOLD` 與出生 Item。

`ITEM1=32003` 與 endpoint `itemset6.csv` 的 exact token audit 目前仍 unresolved，因此不能因 setup.cf 有設定就直接把 32003 寫入 canonical starter item。

## 自動驗證

使用 `node tools/check_endpoint_setup_config_audit.mjs --check`。

CI 會重新從 endpoint 與 pinned fixed-C 讀取 setup.cf，確認 committed audit 沒有漂移。