# Group1 / Encounter→Group 連續性紀錄

> 用途：讓後續新對話可以直接接續目前「阿肥石器時代放置版」的 Group provenance 調查，不必重新說明背景。

## 專案固定背景

- 主專案：`summer55637/afei-lineage1`
- 目標：重建「阿肥石器時代放置版」
- 核心資料來源優先序：RO0000 實際部署資料／舊客戶端／已取得的原作資料；Fixed-C C 與外部公開資料只作語義與版本交叉核對。
- 固定 Fixed-C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- 核心工作規則：**「對遊戲沒幫助的就不要解析了」**
- Group 恢復規則：公開來源可以拿來追 provenance，但 **不得因為相似、猜測、Enemy 名稱／ID、攻略／論壇描述而 synthetic 補 Group**。

## 目前第一優先問題：Encounter → Group source gap

目前 RO0000 active Encounter 使用但 endpoint `group1.txt` 找不到正式 active row 的目標 Group IDs：

```
1, 196, 200, 791, 792, 793, 794, 795, 796, 797,
800, 802, 804, 805, 806, 808, 809, 811, 821, 823,
824, 826, 827, 1131, 1315, 1316, 1327, 1328, 1467, 1500
```

總數：30。

### 已確定的 source boundary

- 30 個 refs 都確實被 active Encounter 使用。
- endpoint `data/group1.txt`：沒有正式 active row；1131 僅有 commented row。
- endpoint `hydata/group1.txt`：1467 有正式 active row，但內容與 Fixed-C 不同。
- Fixed-C `gmsv/data/group1.txt`：1131、1467、1500 有正式 row。
- 其餘 27 個 ID 在 endpoint data、endpoint hydata、Fixed-C 都沒有正式 definition。

因此目前正式定義為 **Encounter coverage source gap**，不是「可以任意找相似 Group 補上」。

## 公開來源調查最新結果

### 1. SourceForge SA80

`SA80 / 石器时代8.0数据规整` 的公開 `group1.txt`：

- 約 75.1 kB
- 1352 lines
- SHA-256：`8513e05d698c9264f6f0eb6533fa8d395d0f5b92396e0755fa7f381b028a7099`
- 公開檔案歷史只有一個初始 commit。

實際找到：

- Group 1131：`1V克达达,1131,-1,-1,428,429,430,1593,,,,,,,1,1,1,1,,,,,,`
- Group 1500：`沉睡中,1500,-1,-1,5054,5055,5056,5057,,,,,,,1,1,1,1,,,,,,`

1500 與 RO0000 / Fixed-C 內容不同，因此不可直接採用。

### 2. GitHub exact-blob family

以下公開 StoneAge 8.0 fork 的 `gmsv/data/group1.txt` 都確認與 Fixed-C **完全相同 blob**：

- alrightlook/StoneAge
- BloodShow/StoneAge
- gamefunc/StoneAge
- stevencoey/StoneAge
- FuZhouhao/StoneAge
- kyonlu/StoneAge
- moiquetyrell/StoneAge
- comsa33/StoneAge
- shencw2/StoneAge
- sihyeonk/StoneAge
- AthenaCN/StoneAge_Original

共同 blob SHA：

`1be75eb3e56ab16d4b433146ec59538ad651c874`

這些只是同一資料族的 clone，不是新來源。

### 3. 其他 GitHub Group variants

- Physwf/physwf-c-lab：blob `4d7eefc874464c62c7ffe6e899e572cb3bafdd32`
- wyhaha777/stoneage2.5：同一 blob
- chenmingbiao/stone-age：blob `5f058f412fa729637f6bcb3d329943c8bb30dff8`
- coolicer/sa：與 chenmingbiao 同一 40,176-byte variant
- Lee-hajin/sking-sasrv：blob `c0aada9e730bf399ebba2fc977da6e2d6ae4aaca`

上述 variant 中，只有 Lee-hajin 另外觀察到 1131 與 1500；沒有取得其餘目標 ID。

### 4. 2012 / 2013 舊資料包線索

這是目前下一階段最值得追的方向：

- 2012 `shiqi8.0`：公開索引明確列出 `gmsv/data/group1.txt`、`encount.txt`、`enemy1.txt`、`enemybase1.txt`；資料包根目錄標示「★凌宇阁@石器服务端」。目前只能看到索引，未取得壓縮檔內容。
- 2012 `WIN6.0.rar`：公開索引同樣確認含 `gmsv/data/group1.txt` 等資料，下載目前受登入限制。
- 2013 SAAC / We Love SA：`SAAC社区WIN端0414.7z`
  - size：1096059857 bytes
  - MD5：`61C209AF2495C1FBF907DAB32D35F2EE`
  - SHA1：`4C0A2E8CB783A5895BAE77B5271C4356D8C7ACA5`
  - CRC32：`9E39EDD4`
  - 帖子明確說明 data 來自「凌宇阁win端单机data」。
  - 公開帖子仍有百度／迅雷入口，但目前尚未取得實際 archive body。
- 2022–2023 另有 StoneAge 8.0 WIN 重新上傳包，可取得下載入口；但帖子記載後續 V1.0–V1.7 私服修改，因此只能當 candidate package，不可直接視為原始 8.0 / RO0000。

## 目前真正結論

- **尚未安全解出 28 個缺失 Group row。**
- 已取得公開歷史 row 證據的目標 ID：1131、1467、1500。
- 目前 **0 個**公開來源 row 被直接升級進 RO0000 runtime。
- 不要再重複花時間搜尋同一 Fixed-C blob 的 fork。
- 下一階段應優先追：
  1. 2012 `shiqi8.0` 實體壓縮檔／鏡像
  2. 2013 凌宇阁 WIN 單機 data／`SAAC社区WIN端0414.7z`
  3. 更早的 8.0 Windows data package（例如龍ZoRo 系列）
- 一旦拿到實體 `group1.txt`，要立即做：
  - 30 IDs exact row scan
  - blob / hash / archive provenance
  - 與 RO0000 endpoint Encounter 對照
  - Group → Enemy → EnemyBase 完整下游閉合
  - 只有 provenance 足夠才 promotion。

## 相關審計檔

- `data/generated/stoneage_endpoint_active_group_gap_triage.json`
- `data/generated/stoneage_public_group_provenance_audit.json`

最新 public provenance audit commit：
`de0beb9187f470203f1af7f6bc145b482f422ad0`

本次連續性紀錄建立日期：
2026-10-03
