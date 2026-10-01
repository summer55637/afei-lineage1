# Endpoint Battle Data Source Audit

更新日期：2026-10-01

## 目的

把 VM 一鍵端實際部署使用的 `encount.txt / group1.txt / enemy1.txt / enemybase1.txt` 先作為 endpoint data catalog，再用 pinned fixed-C 做格式／語義校驗。

## Endpoint 與 fixed-C 差異

| 資料 | Endpoint rows | Fixed-C rows | 相同 rows | Endpoint-only | Fixed-C-only |
|---|---:|---:|---:|---:|---:|
| encount | 818 | 1,197 | 431 | 387 | 766 |
| group1 | 1,199 | 1,392 | 1,072 | 127 | 320 |
| enemy1 | 2,296 | 2,958 | 1,484 | 812 | 1,474 |
| enemybase1 | 1,135 | 1,816 | 743 | 392 | 1,073 |

這代表 endpoint 的敵人／遭遇資料不是 fixed-C 的單純子集；它有大量自己的 variant，不能在 canonical runtime 階段直接丟掉。

## Endpoint 內部引用

目前依既有 fixed-C parser 的欄位位置做「結構性」檢查：

- Encounter → Group：存在 30 個 endpoint Group ID 尚未在 endpoint `group1.txt` 找到，且其中有 active probability 引用；列為 unresolved endpoint boundary。
- Group → Enemy：目前 1,283 個 unique Enemy ID references 全部可在 endpoint `enemy1.txt` 找到。
- Enemy → EnemyBase：目前 1,115 個 unique TempNo references 全部可在 endpoint `enemybase1.txt` 找到。

其中 `group.txt` 另外存在於 endpoint snapshot，但 `setup.cf` 明確指定的是 `group1.txt`。因此不能因為 `group.txt` 有某個 ID 就自動把它當成實際 loaded table。

## Runtime 規則

目前不直接把 endpoint encounter/enemy data 改寫進既有 fixed-C battle catalog。

正式接入前必須完成：

Endpoint setup → selected data file → exact row identity → internal references → loader semantics → Battle Context source binding → regression。

Endpoint variant 本身不是錯誤；無法閉合的部分才保持 unresolved / fail-closed。