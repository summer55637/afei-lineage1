# V3.35 ChangeEvent Compatibility Alias

更新日期：2026-09-30

V3.35 不把 `changeevent` 寫回 pinned functionSet registry；它新增的是明確 opt-in 的 cross-repository compatibility mode。

## Historical external corroboration

公開 `75912001/sa.desktop` 的 `map/maps/1006/map.entity.yaml` 同時列出 `templateName=changeevent`、`functionset=ExChangeMan`、`enemy=changeevent|file:almark/xinshou/xinshoujd.arg`；3006 map 也使用相同標記。

這是 external compatibility evidence，不是 pinned C source evidence。

## Runtime policy

pinned source 現已證明 `jaruga/event/event.template` 將 `changeevent` 綁定到 `ExChangeMan`。strict mode 現在直接使用 source-backed template binding，不需要 compatibilityMode 或 external alias。compatibility registry 仍支援舊資料，但 source-backed binding 優先且不標記 `compatibilityAlias`。

下一步：以 1006 新手接待員做 opt-in browser-style dispatch regression；production strict mode 仍不註冊 changeevent。


V3.64 後本文件中的「external compatibility」只代表歷史 corroboration，不再是 production strict path 的唯一解析來源。
