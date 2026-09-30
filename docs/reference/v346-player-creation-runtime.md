# V3.46 Player Creation Runtime

更新日期：2026-09-30。

V3.46 將創角輸入從文件狀態提升為 canonical Persistent State 的正式 contract。

## 固定 C 規則

- 四圍 VITAL / STR / TGH / DEX：各 0..20；_NEW_PLAYER_CF 下總和只要求不超過 20。
- 四屬性 EARTH / WATER / FIRE / WIND：各 0..10；總和必須等於 10；最多兩個屬性 >0。
- Earth + Fire 不可同時 >0；Water + Wind 不可同時 >0。
- 儲存到固定 C 的 CHAR 欄位時，人物四圍乘 100，元素點數乘 10。
- Work combat 依 fixed-C CHAR_initcharWorkInt 派生；5/5/5/5 對應 attack 6、defence 6、quick 5、MaxHP 35。

## State

新增 creation section，保存 hometown、創角四圍、元素、配置鎖定狀態與 starter grant 狀態。它會跟 Persistent State 一起 round-trip；沒有 source evidence 的資料不自動填值。

## 邊界

V3.46 只完成「創角輸入 → canonical state」這一段。Starter Item 24114 仍只有 source ID / creation path closure，沒有偽造 item template；starter Pet 已由 V3.45 source seed 閉合，但 grant transaction 仍是下一條 atomic creation boundary。

不新增 playable HTML。