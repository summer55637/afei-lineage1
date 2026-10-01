# Endpoint NPC Source Audit

更新日期：2026-10-01

## 目的

將最完整 VM 一鍵端的 `gmsv/data/npc` 與 pinned fixed-C 精確做 path/blob 比對，先辨識實際部署版本的 NPC variant，再決定哪些能進 canonical World Runtime。

## 全量結果

- Endpoint NPC：2,384 files；2,635,314 bytes
- Pinned fixed-C NPC：3,960 files；4,135,763 bytes
- 同 path：2,317 files
- 同 path 且 blob 完全相同：1,803 files
- 同 path 但 blob 不同：514 files
- Endpoint-only：67 files
- Fixed-C-only：1,643 files

## 四個出生城

| Floor | Endpoint | Fixed-C | 同 path | 相同 blob | Variant blob | Endpoint-only | Fixed-only |
|---|---:|---:|---:|---:|---:|---:|---:|
| 100 | 35 | 35 | 35 | 30 | 5 | 0 | 0 |
| 200 | 19 | 19 | 19 | 18 | 1 | 0 | 0 |
| 300 | 36 | 36 | 36 | 32 | 4 | 0 | 0 |
| 400 | 4 | 4 | 4 | 4 | 0 | 0 | 0 |

### 已確認的出生城 variant

- `100/sb_gd.create`：主要是名稱／文字編碼差異，NPC 位置與 enemy file linkage 結構保持一致。
- `100/sb_nusu1.arg`、`100/sb_nusu2.arg`、`100/sb_nusu3.arg`：endpoint 的 `time=1`，fixed-C 為 `time=300`；這是實際 endpoint 配置差異。
- `200/sb_dtp.arg`：endpoint 多出 `REPLACEMENT:21009,43,48;21009,43,48`，fixed-C 沒有。
- `300/sb_bac.create`：endpoint 有重複的相同 NPCCREATE block；fixed-C 只有一個。
- `300/sb_bac.arg`：endpoint `time=3`，fixed-C `time=300`。

上述都是 endpoint variant evidence，不代表它們已經等於 canonical gameplay rule；正式接入仍需 source/loader/semantic closure。

## Runtime 規則

NPC endpoint data 的正式使用順序固定為：

`Endpoint Provenance → Exact NPC path/blob → Create/template/arg linkage → Fixed-C semantic check → Evidence/Regression → Canonical World Runtime`

endpoint variant 不因 mismatch 自動刪除；沒有足夠 semantic evidence 的項目維持 unresolved / fail-closed。
