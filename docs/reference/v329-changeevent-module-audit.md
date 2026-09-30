# V3.29 ChangeEvent Module Audit

更新日期：2026-09-30

V3.29 正式把目前唯一沒有閉合的 first-route NPC module `changeevent` 做成 source audit。

## Fixed-C evidence

Pinned source：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

`gmsv/src/npc/npctemplate.c` 的 `functionSet[]` 沒有 `changeevent`。

`gmsv/src/npc/npctemplate.c::NPC_templateGetTemplateIndex()` 只有在 registry 中找到完全相符的 template name 才回傳 index，否則回傳 `-1`。

`gmsv/src/npc/npccreate.c::NPC_readCreateFile()` 讀取 `enemy=changeevent|file:almark/xinshou/xinshoujd.arg` 時，只有 `templateindex!=-1` 才會把 template 寫進 create record；否則只記錄缺少模組。

因此目前的 pinned source 不能把 new-player `changeevent` NPC 當成 active runtime module。

## Why no alias

`ExChangeMan`、`Charm`、`Action` 都是 pinned `functionSet[]` 中各自獨立的 entry。資料裡出現 `changeevent` 不足以證明任何一個既有 entry 就是它。

公開 StoneAge 文件可以交叉確認 `changeevent` 是 task-NPC 類型，並使用 `EventNo / TYPE / EVENT / GetItem / GetPet / EndSetFlg` 等 DSL；但公開文件不能補出這份 pinned 8.0 source tree 缺失的 C module。urlStoneAge changeevent documentation cross-checkhttps://www.shiqi.me/pt_215.htm

## Decision

`changeevent` = runtime-module-unresolved。

本 repo 不新增假的 `changeevent` C-to-Web alias，也不把 `ExChangeMan` 當替代模板。

## What is already executable

新手事件的 data-side path 已由 V3.23–V3.28 runtime 完整處理：

`condition → branch → Item / Pet / Charm-rule / EventFlag → atomic transaction`

缺少的是「NPC 由世界資料實例化並接受 browser interaction」這個 module registration boundary。

下一步因此改成 Save Transaction integration，而不是繼續複製 event parser。
