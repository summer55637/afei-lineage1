# Endpoint World NPC Linkage

更新日期：2026-10-01

這個 regression 不把 VM endpoint NPC 資料覆蓋進 canonical World Runtime；它只驗證 endpoint 自己的資料鏈：

`setup.cf / npcdir`
→ `data/npc`
→ template
→ create
→ arg file
→ template linkage
→ mapwarp

目前已由 endpoint tree 實際確認：

- 2,384 NPC files
- 57 template / templete files
- 210 create files
- 454 arg / argN files
- 4,734 mapwarp rows

CI 還會由 `tools/generate_world_data_catalog.mjs --source-role vm-one-click-endpoint` 重新解析這個 corpus，並要求：

- `unresolvedTemplateRefs = 0`
- `unresolvedFileRefs = 0`
- source role 必須是 `vm-one-click-endpoint`
- source identity 必須綁定目前 GitHub commit

這代表 endpoint NPC 的 template/create/fileRef 結構可以作為正式 source evidence。

它仍不是完整 gameplay closure：functionSet semantics、event branch、battle hook、NPC movement 與 endpoint-specific loader 行為仍需 fixed-C／evidence／regression 逐項閉合。

這個流程故意生成暫存 endpoint catalog，不把 endpoint 資料寫入既有 pinned fixed-C generated catalog。
