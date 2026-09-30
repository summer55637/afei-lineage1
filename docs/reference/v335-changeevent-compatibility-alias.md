# V3.35 ChangeEvent Compatibility Alias

更新日期：2026-09-30

V3.35 不把 `changeevent` 寫回 pinned functionSet registry；它新增的是明確 opt-in 的 cross-repository compatibility mode。

## External corroboration

公開 `75912001/sa.desktop` 的 `map/maps/1006/map.entity.yaml` 同時列出 `templateName=changeevent`、`functionset=ExChangeMan`、`enemy=changeevent|file:almark/xinshou/xinshoujd.arg`；3006 map 也使用相同標記。

這是 external compatibility evidence，不是 pinned C source evidence。

## Runtime policy

`createCompatibilityNpcModuleRegistry(..., allowExternalCompatibilityAliases=false)` 預設關閉。

開啟後才允許 `changeevent` 解析成已 audited 的 `ExChangeMan` module；結果明確標記 `compatibilityAlias:true` / `compatibilityOnly:true`。

Strict mode 仍然 `changeevent → unresolved`；compatibility mode 才是 `changeevent → ExChangeMan`。

下一步：以 1006 新手接待員做 opt-in browser-style dispatch regression；production strict mode 仍不註冊 changeevent。
