# V3.64 ChangeEvent source resolution

更新日期：2026-09-30

V3.63 的 fail-closed 結論被自己的 CI 推翻：pinned fixed-C 實際存在 gmsv/data/npc/jaruga/event/event.template，而且明確定義 templatename=changeevent、functionset=ExChangeMan。

## Pinned source chain

enemy=changeevent|file:...
→ NPC_templateGetTemplateIndex("changeevent")
→ pinned gmsv/data/npc/jaruga/event/event.template
→ functionset=ExChangeMan
→ pinned gmsv/src/npc/npc_exchangeman.c.

npctemplate.c 的 NPC_readNPCTemplateFiles() 會遞迴載入 template；NPC_templateGetTemplateIndex() 對 exact template name 做 lookup。這次 actual pinned template entry 補上了之前 audit 缺失的 registry evidence。

## Browser runtime

V3.64 在 stoneage_npc_module_registry_runtime.mjs 新增 source-backed template bindings。strict registry 在載入已 audited 的 ExChangeMan module 後，可以直接以 NPC template name changeevent resolve，結果標記 sourceBackedTemplate=true、compatibilityAlias=false。

Dispatcher 對 source-backed template 以 resolved_pinned_template 重新送入 interaction gate，避免舊 generated row 的歷史 unresolved flag 阻擋已完成的 source resolution。

## 五個 start-floor instances

四個 xinshou.create 新手接待員與 1006 的薩姆吉爾村長，共 5 個 start-floor changeevent instances，現在全部標記為 source-resolved。座標 reachability audit 也將 5 個原本「未審計」的 interaction row 收回到 46/46 coordinate-resolved interaction set。

新手事件 owner xinshoujd.arg 的 reward mutation chain 原本就已 source-closed；V3.64 只補上 template/module closure，不重寫 Event DSL、Item/Pet reward semantics。

## Compatibility mode

External changeevent → ExChangeMan material 仍保留作歷史 corroboration，但已不再是 strict runtime 的必要條件。compatibility registry 開啟時也優先使用 pinned source-backed binding，因此 changeevent 不會被標成 compatibilityAlias。

V3.64 沒有新增 synthetic template、沒有把外部 repository 內容寫入 pinned source，也沒有改動 4000→200 movement exception 或 Starter Item 24114 fail-closed policy。
