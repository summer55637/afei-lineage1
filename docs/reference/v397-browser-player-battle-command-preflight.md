# V3.97 Browser Player Battle Command Preflight

更新日期：2026-10-01

V3.97 在 V3.96 command normalization 上加入 fixed-C `checkErrorStatus()` 前置檢查，並修正 Pet command 的 transport 語意。

## Status gate

fixed-C `checkErrorStatus()` 檢查：

- paralysis
- stone
- sleep
- dizzy
- dragnet

它不檢查 Barrier。

若上述狀態任一有效，`BattleCommandDispach()` 會改走 `N`，即：

`BATTLE_COM_WAIT` + `BATTLE_CHARMODE_C_OK`

V3.97 完整保留這個 fallback。

## Pet command transport

固定 C 的 `S|...` 不是 battle target：

- `-1`：Pet In
- `0..4`：Pet Out，因 pinned `CHAR_MAXPETHAVE=5`

因此 V3.97 將 `petIndex` 與 battle `targetBid 0..19` 分開；舊的 `targetBid=4` 仍作 compatibility input，但語意已改成 pet slot。

## Boundary

尚未加入：

- ride-pet exclusion
- `_STANDBYPET` feature branch
- MP deduction
- item / magic / PetSkill / profession command checks
- actual execution
- damage

Regression：`tools/check_v397_browser_player_battle_command_preflight.mjs`
