# GroupID 1230 research checkpoint

這份文件記錄 V3.10 groundwork 對 `group1.txt` 缺失 GroupID `1230` 的外部證據追查。

## Fixed source boundary

- repository: `gavinlinasd/StoneAge`
- ref: `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- active tables: `gmsv/data/group1.txt`、`gmsv/data/enemy1.txt`、`gmsv/data/enemybase1.txt`

目前 pinned generated runtime 仍把 Group `1230` 標成 unresolved；本輪沒有找到能逐欄核對、且 provenance 足以直接升級到 pinned ref 的 `group1.txt` 原始列。

## Where Group 1230 is referenced

目前 Floor `100`（薩伊那斯）Encounter `21`～`25` 都引用 Group `1230`，每筆 weight 都是 `100`：

- Encounter 21: `88/91/89/92` 之外另含 `1230`
- Encounter 22: `88/91/89/92/94` 之外另含 `1230`
- Encounter 23: `90/93/94` 之外另含 `1230`
- Encounter 24: `89/92/96/99/95/98` 之外另含 `1230`
- Encounter 25: `90/93/97/100` 之外另含 `1230`

這些 Encounter 都仍有其他已解析 Group，因此 `1230` 目前造成 degraded coverage，但不是 blocking encounter。

## External evidence found

### 1. We Love SA: 8.0 startup log

公開的 SA GMSV 8.0 啟動紀錄把 `group1.txt` 明確列為「遇敵組群文件」，並記錄「有效遇敵組群數是 1230」。同一紀錄標示服務端版本為 `SA GMSV 8.0 (for sa_8002)`，編譯時間為 2010-01-25。

重要限制：這只能證明該套 8.0 執行資料在啟動時報告有效遇敵組群數為 1230，**不能單獨證明存在 `GroupID=1230` 的 row**，也不能證明該 row 與 pinned `gavinlinasd/StoneAge@1f90cb6...` 完全相同。

### 2. SourceForge: SA80 8.0 data archive

SourceForge 的 `SA80 / 石器时代8.0数据规整` 公開目錄確實包含：

- `group1.txt`（75.1 kB）
- `enemy1.txt`（292.0 kB）
- `enemybase1.txt`（238.4 kB）
- `encount.txt`（72.8 kB）

該資料集頁面的檔案日期是 2016-12-09～2016-12-10。它是很有價值的 candidate dataset，但不是本專案的 pinned source revision，因此本輪只作 discovery evidence，沒有搬入任何 row。

## Data-layer interpretation

公開 `shiqi.me` 資料研究再次確認：`encount.txt` 第 11 欄引用的是 `group1.txt` 的 Group 編號，不是 `enemy1.txt` 的 Enemy ID；`group1.txt` 的後續欄位才再引用 Enemy ID。

所以目前不能因為其他地方出現數字 `1230`，就把它當成 Group `1230` 的內容。尤其 generated Lv1 pet data 裡的 EnemyID `1230` 是另一個資料層的 `加比奥`，不能反推 Group `1230`。

## Current decision

**Group `1230` 維持 unresolved / non-spawnable。**

不跨版本匯入，不用 EnemyID `1230` 反推 Group row，不用攻略／AI／掉落資料拼湊完整 Enemy template。只有找到可釘定到相容 revision 的完整 `group1.txt` row，並能向下閉合 `enemy1.txt → enemybase1.txt`，才升級 source closure。

## Search record

本輪已追查：GitHub fixed repo、SourceForge SA80、We Love SA 8.0 startup log、`shiqi.me` group/encount 資料格式說明，以及 Group `1228`～`1232` 的公開索引搜尋；目前仍沒有取得可直接核驗的 Group `1230` 原始列。
