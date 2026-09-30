# Reward Transaction Contract

更新日期：2026-09-30

本 contract 把 fixed-C 的 `BATTLE_AddProfit / BATTLE_AddExpItem` boundary 變成可持久化 transaction；它只接受 battle runtime 已經決定的 reward packet，不重新抽 reward RNG。

## Source-backed ordering

固定研究已確認：Enemy 第一次 HP 歸 0 時建立 death credit；source reward pool 在 ItemCrush boundary 後由 AddProfit-side processing 收尾。Carried item 的選擇在 death-credit 階段決定，勝利結算不重新跑同一顆 reservoir RNG。證據來源：docs/changelog/part-04-v0.97-to-v1.26.md、docs/changelog/part-06-v1.52-to-v1.74.md。

同時，player-side reward 只對具有 player-side death credit 的 Enemy 生效；enemy-side 自滅不自動產生玩家 EXP／掉落。Pet 若已取得 death credit，相關 Pet EXP 使用對應的 pet credit，而不是重新以 activePetId 猜測。證據來源：docs/changelog/part-04-v0.97-to-v1.26.md。

## Packet

| 欄位 | 說明 |
| --- | --- |
| transactionId | 唯一交易鍵，用於 idempotent commit |
| source | battle/source result provenance |
| playerExp | 已決定的玩家 EXP |
| petCredits | 已決定的 Pet EXP / Gold credit |
| gold | 已決定的玩家 Gold 增量 |
| items | 最多 3 件已解析 existing-item index |
| metadata | provenance / audit metadata；不在這層解釋未知欄位 |

## Fail-closed

unknown existing item index、非 24 格玩家背包、重複 item index、空 transactionId 都拒絕 commit。

Inventory full 不做部分 commit；transaction 必須整體成功或整體不寫入。

同一 transactionId 再次提交不重複增加 Gold / EXP / Item，而是回傳 idempotent。

## 明確不在本層處理

battle damage、encounter RNG、ItemCrush RNG、drop reservoir RNG、battle result、補給門檻、死亡復活政策都不在 transaction layer 重新計算。

Runtime：`src/stoneage_reward_transaction.mjs`
Regression：`tools/check_reward_transaction.mjs`
Generated contract：`data/generated/stoneage_reward_transaction_schema.json`
