# V3.33 NPC Module Registry Guard

更新日期：2026-09-30

V3.33 把 pinned functionSet registry 的 unknown 與 create file 引用不存在的 template 分成兩種不同證據。

## Current evidence

`data/generated/stoneage_world_npc_functionset_audit.json` 的 pinned `npctemplate.c/functionSet[]` 有 55 個已知 function sets、20 個資料端 unknown。

重要的是：`changeevent` 不在這 20 個 unknown 裡。它是另一種 discrepancy：`xinshou.create` 明確引用 `enemy=changeevent|file:...`，但 pinned `functionSet[]` 裡沒有 `changeevent`。

因此不能把 `changeevent` 當成「已知但未接線」；它應保持 `not-in-pinned-functionset-registry`。

## Registry guard

`createAuditedNpcModuleRegistry()` 只接受 audit catalog 已存在於 pinned `sourceFunctionSets` 的 module。

`ExChangeMan` 可以被 explicit module registry 提供；`changeevent` 即使 caller 偷塞 module，也會被拒絕。其他自造 template name 同樣不會進 production registry。

下一步：讓 V3.32 dispatcher 使用這個 audited registry，並把 future browser module wiring 變成 source-audited only。
