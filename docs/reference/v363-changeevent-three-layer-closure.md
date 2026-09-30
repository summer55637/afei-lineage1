
# V3.63 ChangeEvent three-layer source closure

更新日期：2026-09-30

## 1. Create parser

fixed-C gmsv/src/npc/npccreate.c 解析 enemy= 時，先從 enemy=foo|arg 取出 foo，再呼叫 NPC_templateGetTemplateIndex(foo)。只有 index != -1 才會寫入 NPC_Create.templateindex[] 並增加 enemyreadindex。若沒有成功的 enemy template，block close 會以 enemyreadindex == 0 視為無效 enemy data。

所以 enemy=changeevent|... 不是單純字串標記；它必須在 template registry 裡找到 changeevent 才能成為 active create record。

## 2. Template registry

fixed-C NPC_readNPCTemplateFiles() 會從指定 topdirectory 遞迴取得檔名，只對合法 NPC template file 呼叫 NPC_readTemplateFile()。NPC_templateGetTemplateIndex() 對已載入 template 做 exact name + hash 比對，找不到就回 -1。

V3.63 workflow 直接 checkout pinned source，對 gmsv/data/npc 的 *.template 做全樹掃描，確認沒有 templatename=changeevent，亦沒有 functionset=changeevent。

## 3. Five affected instances

- 1006 (15,22)，almark/xinshou/xinshou.create block 2
- 2006 (22,15)，almark/xinshou/xinshou.create block 0
- 3006 (23,18)，almark/xinshou/xinshou.create block 1
- 4006 (14,20)，almark/xinshou/xinshou.create block 3
- 1006 (18,22)，genout/shop_m.create block 12

前四個都指向 almark/xinshou/xinshoujd.arg；第五個指向 genout/msg_1006_18_22。

## 4. Compatibility separation

公開 StoneAge script references 把 changeevent 描述成任務型 NPC，並使用 EventNo / TYPE / EVENT / GetItem / GetPet / EndSetFlg 等 DSL。另有 external compatibility material 將 changeevent 與 ExChangeMan 對應；這些資料可作 compatibility reference，但不能反推 pinned 8.0 tree 有同名 template。

因此 strict fixed-C mode 保持 fail-closed；compatibility mode 必須明確提供 alias catalog 才能啟用。

## 5. Final classification

runtime-module-unresolved 保留作資料欄位兼容值；V3.63 新增 closureClass=source-proven-non-instantiable-in-pinned-build，表示目前不是「還沒找到 handler」，而是「依 pinned create parser + template registry 已證明不能正常實例化」。

下一工作焦點轉向 Persistent State / Idle Loop 與唯一 playable entry，不再為 changeevent 猜造 C module。
