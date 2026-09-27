# 阿肥石器時代放置版

《石器時代 OL》PC／手機共用的純前端單機放置版。

## 目前版本

**PLAYABLE CORE V2.52**

目前專案已經從資料整理階段進入可玩核心與原 C 行為逐步對齊階段。

固定開發原則：

> **原 C 規則優先、不猜數值**

固定原 C 基準：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

## V2.52 最新進度

V2.52 接入獵人 **Skill 68「地結界」／`PROFESSION_BOUNDARY`**。這一版只開 Skill 68；Skill 69～72 雖共用同一個函式名，仍保持未接入，避免提前扣 MP 卻跑到半套效果。

fixed row：TARGET 2（ALL_MYSIDE）、KIND 1、option `地结界|...`。實際 MP 沿用既有 source dynamic branch：M-tier ≤6 為 **10 MP**、7～9 為 **15 MP**、10 為 **20 MP**；row 的 `costMp=14` 只保留 fallback 資料，不作 live 扣魔。

### power 與 turn 是兩套等級來源

Boundary case 進入前，battle callback 已把 display level 轉為 A-tier，因此回合使用 A-tier：

- tier 10 → turn 5
- tier 9 → turn 3
- tier 5～8 → turn 2
- tier 0～4 → turn 1

source 還有一個 `tier > 9 → turn 4` 分支，但 A-tier 是整數，實際上被前面的 `>=10` 吃掉，因此 **turn 4 在 fixed 可達路徑不存在**。

接著 source 又重新讀 `CHAR_WORKBATTLECOM3 high` 的 raw display level 算 power：≤20=20、21～40=30、41～60=40、61～80=50、81～85=60、86～90=70、91～95=80、96～99=90、≥100=100。

每個同側有效 Battle Entry 都存成等價 `MAKE2VALUE(power, turn)`。施放新結界前，source 會先把該目標的地／水／火／風四個結界全部清 0，再只寫地結界。

### 最重要的 fixed 減傷 bug

`BATTLE_DamageCalc()` 在四屬性 `BATTLE_AttrAdjust()` 之後檢查結界，但**stored power 完全沒有拿來算減傷比例**。地結界只用 high word `power > 0` 判斷「地結界存在」，真正公式是：

`damage = trunc(damage - damage * attackerEarth / 200)`

所以攻擊者地屬性 100 才是 50% 減傷；地屬性 20 只有 10%。Skill 68 stored power 20 與 100 在物理減傷率上完全相同，只影響「是否大於 0」。V2.52 保留這個來源 bug，不把技能 power 擅自改造成正規減傷百分比。

另外 source 是 `earth -> water -> fire -> wind` 的 `else if` 鏈；地結界存在但攻擊者 earth=0 時，不會改拿其他屬性計算。

這條結界只出現在 **physical `BATTLE_DamageCalc()`**；profession magic 的 `PROFESSION_MAGIC_GET_DAMAGE()` 沒有讀 boundary Work，因此 V2.52 不把地結界擴張成魔法減傷。

Critical 也有來源順序差異：`BATTLE_CriDamageCalc()` 先拿已套結界的 `BATTLE_DamageCalc()`，再額外加防禦×等級比×0.5；所以**額外 critical bonus 不吃結界減傷**。現有 Web pipeline 本來就是先 `battleDamageCore()` 再加 critical bonus，V2.52 只把結界插在 core 的 AttrAdjust 後、OtherDamage 前。

### post-action 倒數與 low=0 ghost

結界不是 StatusSeq 開頭扣回合，而是在該 Battle Entry 的 command 完成後才：`low = low - 1`。

只有 `low <= -1` 才清除，所以 low=0 時 high power 仍 >0，結界依然有效。玩家施放 ALL_MYSIDE 的同一個 action 結束後，玩家自己的結界會立刻先扣一次；Pet 的結界要等 Pet 自己 command 結束後才扣。

V2.52 把這個 tick 接到現有 `command -> CHECK_ITEM_RELIFE -> outer AddProfit` 邊界，順序改成 **command → boundary tick → relife → AddProfit**，因此防禦、混亂、Pet skill、NoAction 等可達 command lifecycle 不必各自重寫。

### 動畫

Skill 68 正常 Player side pseudo target=20，fixed `PROFESSION_MAGIC_GET_IMG2()` 會把 row img2 101789 改為右側地結界 **101786**；img1 保持 row 101697。

新增 `tools/check_v252_profession_earth_boundary_runtime.mjs`，鎖住 Skill 68-only gate、dynamic MP、A-tier turn unreachable-4 bug、raw-level power、ALL_MYSIDE、clear-four/write-earth、post-action low=0 ghost、stored-power-ignored physical formula、critical/OtherDamage ordering、右側動畫與 V2.48～V2.51 regression；**save schema 維持 30**。

## V2.51 最新進度

V2.51 接入獵人 **Skill 67「號召自然」／`PROFESSION_CALL_NATURE`**，對齊 fixed `battle_profession_assist_fun()` 的總治療池分攤、動畫、HP cap 與 Pet recovery AI 副作用。

fixed row：TARGET 2（ALL_MYSIDE）、KIND 1、row `costMp=14`。但實際扣魔早已有 source dynamic branch：`PROFESSION_MAGIC_COST_MP()` 對 CALL_NATURE **固定回傳 50 MP**，所以 V2.51 不採 row 14。

### raw display level 治療總池

這招完全不做 A-tier/M-tier 轉換；直接讀 raw display level：

- ≤20 → 500
- 21～40 → 1000
- 41～60 → 2000
- 61～80 → 2500
- 81～85 → 3000
- 86～90 → 3500
- 91～95 → 4000
- 96～99 → 4500
- ≥100 → 5000

這些數字是**整招總治療池**，不是每個目標各拿一份。

### BATTLE_MultiList 與分母

TARGET ALL_MYSIDE 在目前 Player side 會解析成 pseudo target **20**。fixed 先 `BATTLE_MultiList()` 取得當下仍可被鎖定的同側 Battle Entries，再計算分母：

- 沒有騎寵：該 Entry `count += 1`。
- 有騎寵：該 Entry `count += 2`，之後主人與騎寵各補同一個 addhp。

目前放置版尚未建立正式 `CHAR_RIDEPET` 系統，因此 active pet 仍是獨立 Battle Entry，**不能假裝成玩家騎寵**。正常玩家＋出戰寵都活著時 count=2；只有玩家時 count=1。

`addhp = totalPool / count` 使用 C 整數除法。每個實際 Entry 都加同一個 addhp，最後 clamp 到 `CHAR_WORKMAXHP`；封包顯示值仍是 raw addhp，不改成實際因 HP 上限而縮短的 healed amount。

### 動畫覆寫

fixed row 的 img1 是 101773，但當 defNo 為 20／25／26（右方）時 source 會覆寫成 **101772**。Skill 67 正常 ALL_MYSIDE=20，因此 live 固定走 101772。

img2 不採 row 的 101654，而依**分攤後 addhp**決定：

- addhp ≤100 → 100601 (`SPR_heal`)
- addhp ≤300 → 100602 (`SPR_heal2`)
- 其他 → 100603 (`SPR_heal3`)

### Pet recovery AI 與封包 truthiness bug

若被治療的 Battle Entry 本身是 `CHAR_TYPEPET`，risk battle 下第一次 recovery 會做 `AI_FIX_PETRECOVERY`，也就是現有 runtime 的 VARIABLEAI **+10**，並用 `CHAR_BATTLEFLG_RECOVERY` 保證同場不重複加。V2.51 直接重用既有 `battlePetRecoveryAiIds` closure。

另外保留 fixed 的封包 bug：source 先令無騎寵 `ridepet=-1`，之後卻輸出 `ridepet ? addhp : 0`。C 裡 -1 為 true，因此**沒有騎寵時 `p` 欄仍送 addhp**，但實際不會多補任何騎寵 HP。Web regression 只記錄這個 protocol 行為，不憑空建立騎寵。

新增 `tools/check_v251_profession_call_nature_runtime.mjs`，鎖住 Skill 67 metadata、dynamic 50 MP、raw level pool、ALL_MYSIDE=20、count 分攤、HP cap、動畫覆寫、Pet +10 once-per-battle、無騎寵 packet `p` bug、V2.48～V2.50 regression；**save schema 維持 30**。

## V2.50 最新進度

V2.50 接入獵人 **Skill 66「自然威能」／`PROFESSION_RESIST_F_I_T`**，完整保留 fixed `_PROFESSION_ADDSKILL` 下的三抗特殊判定與 source level bug。

fixed row：TARGET 5（NONE）、KIND 3、option `抗|成%100|回%3`。表面 `costMp=14` **不是實際扣魔**；既有 `PROFESSION_MAGIC_COST_MP()` 分支會先把 display level 轉成 M-tier，再扣 **5／10／15／20 MP**，V2.50 沿用現有 dynamic MP bridge。

### 強制自體與特殊命中

和 Skill 59～61 一樣，fixed `_PROFESSION_ADDSKILL` 會把實際目標強制改成施術者自己。

但 `PROFESSION_BATTLE_StatusAttackCheck()` 對 `BATTLE_ST_RESIST_F_I_T` 有專用 early branch：

1. 一進函式仍先消耗 `RAND(1,100)`。
2. 檢查死亡。
3. **只檢查火／冰／雷三個 resist StatusTbl 是否已存在。**
4. 三抗都沒有就直接 `return 1`。

因此 option 的 `成%100 + A-tier×4` threshold 仍可計算，但 **roll 完全不參與成敗**；而中毒、睡眠、遺忘等其他 StatusTbl 也不會阻止自然威能。這不是一般 status 的互斥規則。

### 三個 StatusTbl 同時建立

成功後不是建立一個 combined status，而是同時寫：

- `StatusTbl[RESIST_F] = turn+1`
- `StatusTbl[RESIST_I] = turn+1`
- `StatusTbl[RESIST_T] = turn+1`

所以之後普通 status 會把它視為「已有狀態」，單體火／冰／雷抗也會被擋；自然威能自己再次施放則因任一三抗 counter >0 而失敗。

### raw display level 的來源 bug

status callback 一開始已把技能轉成 A-tier，但自然威能在計算 duration 前又重新讀 `CHAR_WORKBATTLECOM3 high` 的**原始 display level**。

回合因此是：

- display level ≥100 → turn 5 → stored **6**
- display level >80 → turn 4 → stored **5**
- 其餘 → turn 3 → stored **4**

抗性值也沿用這個 raw display level，且 source 寫成 1～10 級表：

- Lv1 → +2
- Lv2 → +4
- …
- Lv9 → +18
- **Lv10 以上全部 +20**

所以技能正常學會時初始 display Lv10 就已直接得到 +20 火／冰／雷抗；不把這個明顯怪異的 source 行為「修正」成 A-tier。

### 倒數與 ghost counter

三個 RESIST StatusTbl 每次 Player 自己行動都一起 `--cnt`。降到 **1** 時，三屬抗性都先減回各自的 stale `WORKMODRESIST_*`，實際加成已消失，但三個 counter 仍各為 1，繼續阻擋新的 status／resist。

下一次自己行動 1→0 才真正清除 counters；三個 MOD raw Work 仍保持舊值，直到 battle reset 或下一次 resist 重寫。Web 以同一個 combined runtime state 模擬三個同步 counters，不另造不存在的第四個 combined counter。

新增 `tools/check_v250_profession_nature_resist_runtime.mjs`，鎖住 Skill 66 metadata、dynamic MP、forced self、raw EarthRound gate、roll-consumed-but-ignored、只檢查三抗、raw display power/turn bug、三 StatusTbl、ghost counter、stale MOD 與 V2.48/V2.49 regression；**save schema 維持 30**。

## V2.49 最新進度

V2.49 完成獵人 **Skill 62「遺忘」／`PROFESSION_OBLIVION`** 的 fixed StatusTbl、Pet client skill-list 與恢復生命週期。

fixed row：MP 21、TARGET 1（OTHER）、KIND 2、option `忘|成%100|回%3`、command `BATTLE_COM_S_OBLIVION`。

### 成功率、回合與遺忘數量

display level 先經 A-tier 0～10。成功率與其他 profession status 相同：

`Success = 100 + tier×4`

而且 `PROFESSION_BATTLE_StatusAttackCheck()` 一定先消耗 `RAND(1,100)`，之後才檢查死亡／既有 StatusTbl；成功條件仍是嚴格 `roll < Success`。

OBLIVION 自己覆寫 duration：tier 0～4=2、5～9=3、10=4；實際寫進 StatusTbl 為 `turn+1`，所以 stored counter 是 **3／4／5**。

`CHAR_WORKMODOBLIVION = max(1, trunc(tier/2))`，即 1～5。但 client 的 Y-list 會再做：

`f_num = MODOBLIVION + 1`

所以一次最多可把 **2～6 個**有效寵技槽暫時改成不可選。

### Y/W client skill-list RNG

fixed `CHAR_makeStatusString('y')` 並不是永久刪除技能。成功套用時先送正常 W-list，再送一份遮蔽版 W-list：

- 逐一掃 7 個 PetSkill 槽。
- 只有有效 PetSkill 才消耗 `RAND(0,100)`。
- 即使是 Skill ID 1、或忘卻配額已經用完，該有效槽仍會先吃 RNG。
- 條件 `roll <= 60 && skillId != 1 && f_num > 0` 才暫時改成 `PETSKILL_FIELD_MAP=2 / PETSKILL_TARGET_NONE=5`。
- Skill ID 1 永遠不會被遮蔽。
- 這只是 client 可選清單；server 的低忠誠 RANDOMACT 並沒有讀 `CHAR_WORKOBLIVION`，因此 Web 不把它錯做成「全面封印 Pet AI」。

### 非 Pet 目標的來源怪行為

status-change callback **沒有 CHAR_TYPEPET gate**，所以若 protocol 把 OTHER 指到 CHAR_TYPEENEMY，原 C 仍會先寫 OBLIVION StatusTbl。真正「忘技能」的 W/Y owner-Pet refresh 才是 Pet 專屬。

因此目前 PVE 的 Enemy 可以得到 OBLIVION StatusTbl，會參與「已有狀態」互斥與倒數，但 **不會憑空禁止 Enemy AI 技能**；只有實際 Pet target 才建立 client skill mask。

### 恢復與 battle end

`BATTLE_StatusSeq()` 先 `--cnt`。OBLIVION 在 decrement 後 `cnt <= 1` 時就明確：

- 把 OBLIVION status 寫 0。
- 重新送正常 W-list，恢復全部寵技可選狀態。

所以它比一般 status 的 generic 0-clear 早一格恢復。

另外 `BATTLE_Exit()` 會掃玩家持有寵；只要仍有 OBLIVION，就強制清 0 並送 W-list。Web battle reset 同步清除 client mask，不讓遺忘跨戰鬥殘留。

新增 `tools/check_v249_profession_oblivion_runtime.mjs`，鎖住 Skill 62 metadata、100+tier×4、3/4/5 stored counter、MODOBLIVION、+1 mask budget、有效槽 RNG、Skill 1 免遮蔽、FIELD_MAP/TARGET_NONE、counter=1 恢復、battle reset、PVE non-Pet 不發明封技；**save schema 維持 30**。

## V2.48 最新進度

V2.48 完成獵人 **Skill 58 fixed 錯綁 closure**，並正式接入 **Skill 59～61 雷／火／冰抗性**。

### Skill 58「自給自足」其實不是製作技能

fixed `gmsv/data/profession.txt` 第 58 筆原文就是：

`自给自足,...,PROFESSION_ENRAGE,...,58,...`

也就是資料表把它綁到勇士 Skill 35 同一個 `PROFESSION_ENRAGE -> BATTLE_COM_S_ENRAGE`。雖然 source code 另有 `PROFESSION_AUTARKY()`，該函式只 `return TRUE`，而 fixed profession row 根本沒有指到它。

因此 V2.48 **不修正資料表、不發明材料製作**；Skill 58 照 fixed 錯綁直接走既有激化攻擊 lifecycle。新增 regression 鎖住這個來源 bug。

### Skill 59～61 fixed rows

- 59 雷抗性：`PROFESSION_RESIST_THUNDER`，MP 14，option `雷|成%100|回%3`
- 60 火抗性：`PROFESSION_RESIST_FIRE`，MP 14，option `火|成%100|回%3`
- 61 冰抗性：`PROFESSION_RESIST_ICE`，MP 14，option `冰|成%100|回%3`

固定 build 有 `_PROFESSION_ADDSKILL`，所以 source 在 status-change callback 內會把這三招的 `defNo2` **強制改為施術者自己的 battle slot**。舊版依等級擴成單排／全體的分支被 `#else` 排除；V2.48 永遠只加 Player 自己。

### 成功率與 StatusTbl 互斥

三招都先走 `PROFESSION_BATTLE_StatusAttackCheck()`：

1. 一進函式先消耗 `RAND(1,100)`。
2. 才檢查目標死亡／已有任何 StatusTbl 狀態。
3. 最後用嚴格 `roll < Success`。

`Success = option 成%100 + A-tier×4`。

因此 tier 0 是 **99%**（roll 100 失敗），tier 1 以上因 threshold >=104，在沒有既有狀態時必定成功。即使因已有狀態而失敗，前面的 RNG 仍照樣消耗。

RESIST_F/I/T 本身就是 StatusTbl，所以它會參與 Web 的共用 `battleHasAnyStatus()`：三抗彼此不能疊，也會阻止／被一般 StatusTbl 狀態阻止。

### 抗性值與 stored counter

成功後：

`upValue = A-tier + 10` → **10～20**

`WORK_*_RESIST += upValue`

`WORKMODRESIST_* = upValue`

回合：tier 0～4=3、5～9=4、10=5；真正寫進 StatusTbl 的是 `turn+1`，所以 stored counter 為 **4／5／6**。

### 幽靈 1 回合來源行為

`BATTLE_StatusSeq()` 每次 Player 自己行動時先 `--cnt`。當 RESIST counter 減到 **1** 時，source 已經：

`WORK_*_RESIST -= WORKMODRESIST_*`

也就是實際抗性效果先消失；但 StatusTbl counter 還是 1，仍會阻擋新狀態。下一次自己行動才 1→0，generic loop 直接清掉狀態。

`WORKMODRESIST_*` 在這裡不會清 0，會以 stale raw Work 留到 battle reset 或下次同屬性重寫。V2.48 同樣保存。

### Profession magic 對應

新增 `sourceProfessionPlayerResistVector()`／`sourceProfessionPlayerResistForMagicType()`，固定映射：

- magic type 1 → Fire resist
- magic type 2 → Thunder resist
- magic type 3 → Ice resist

這對齊 `PROFESSION_MAGIC_GET_DAMAGE()` 與 profession magic dodge 的 source 欄位；不把它錯接到一般地／水／火／風 `magicResist[4]`。

新增 `tools/check_v248_profession_resist_runtime.mjs`，鎖住 Skill 58 fixed 錯綁、59～61 metadata、自體強制目標、strict success、StatusTbl 互斥、10～20 抗性、4/5/6 stored counter、幽靈回合、stale MOD、magic type mapping、V2.48 marker；**save schema 維持 30**。

## V2.47 最新進度

V2.47 接入獵人 **Skill 57「激怒寵物」／`PROFESSION_ENRAGE_PET`**，完整保留 fixed「先攻擊自己陣營，再寫 Pet MYSKILLSTR」的特殊生命週期。

fixed row：MP 13、TARGET 1（OTHER）、KIND 2、option `攻%20|防%10|倍%2|效%1|回%3`、command `BATTLE_COM_S_ENRAGE_PET`。

### 這招不是單純 Buff

`battle.c` 沒有把 ENRAGE_PET 放進一般「禁止同隊互打」gate；`battle_profession_attack_fun()` 反而明確要求 raw target **必須同隊**，然後：

1. 把施術者 `WORKATTACKPOWER = 0`。
2. 仍對原 raw target 跑完整 `BATTLE_AttackSeq()`。
3. 若算出的 damage 足以讓目標死亡，才把最終 damage 強制改成 0。
4. 走 `BATTLE_DamageSub()`；此技能的 DamageReact 被 profession helper 清掉，也沒有普通 SUITPOISON／Counter。
5. 最後重新讀原 raw target；只有 `CHAR_TYPEPET` 才寫攻擊 Buff。

因此選到同隊 Player 時可能跑 0 攻擊 AttackSeq，但最後**不會得到 Buff**。Web live UI 目前只有一名 Player + 一隻出戰 Pet，所以 Skill 57 直接選 fixed Pet bid 5；explicit protocol fixture 仍保留 bid 0 的來源怪路徑。

### 主人打自己 Pet 的忠誠副作用

`BATTLE_AttackSeq()` 很早就會對 owner→own Pet 執行 `CHAR_PetAddVariableAi(..., AI_FIX_SEKKAN)`，也就是 -2.00 忠誠修正；這發生在 Dodge／MISS 之前。

V2.47 直接沿用既有 `battleApplyPhysicalHit()` owner→Pet 修正，因此即使這次 0 攻擊閃避／MISS，忠誠副作用仍保留。為了對齊 profession helper，這條呼叫新增 `suppressDamageReact:true`，同時保留 `suppressSuitPoison:true`。

### STR power 與回合

display level 經 A-tier 0～10 後：

`MYSKILLSTRPOWER = tier×2 + 10`

即 **10～30%**。

回合 Work：

- tier 0～4 → 3
- tier 5～9 → 4
- tier 10 → 5

加攻不是用 Pet STR 自己當百分比基底；fixed `Other_DefcharWorkInt()` 的來源 bug 是：

`FIXSTR += (saved FIXTOUGH * MYSKILLSTRPOWER) / 100`

所以 V2.47 用 Pet 的 defense/FIXTOUGH base 算 STR add，保留 C int 截斷。

### 與 SetMagicPet 共用 raw Work

ENRAGE_PET 直接覆寫 `CHAR_MYSKILLSTR / CHAR_MYSKILLSTRPOWER`：

- 既有 SetMagicPet STR 會被覆蓋。
- SetMagicPet TGH／DEX 使用不同 raw Work，可和激怒寵物 STR 共存。
- 激怒寵物 STR 尚在時，後續 SetMagicPet 的 busy gate 必須看到 `MYSKILLSTR>0` 而拒絕施放。
- STR turn 歸零後 POWER 不清 0；原 C 只在 battle entry 的 BadStatusAllClr 清 raw power。V2.47 以 battle-local raw mirror 保存這個 stale power。

### PreCommand / StatusSeq 時序

施放當下不 retroactively 重建本輪 Pet FIXSTR。下一輪 `PreCommand -> Other_DefcharWorkInt` 才把 STR bonus 寫進能力快照。

但 `MYSKILLSTR` 倒數是在**目標 Pet 自己輪到行動時**的 `BATTLE_StatusSeq()`：若 Player 先施放、Pet 在同一輪稍後才動，新寫入的 3/4/5 會先扣 1，而本輪能力快照仍沒吃到新 Buff。V2.47 刻意保留這個依行動順序不同而損失一回合的來源行為。

新增 `tools/check_v247_profession_enrage_pet_runtime.mjs`，鎖住 Skill 57 metadata、同隊 Pet bid 5、0 AttackPower AttackSeq、致死傷害歸 0、忠誠副作用入口、DamageReact/SUITPOISON suppression、10～30% STR power、3/4/5 回合、SetMagicPet STR overwrite/TGH-DEX coexist/busy、PreCommand snapshot、Pet StatusSeq 倒數與 V2.47 marker；**save schema 維持 30**。

## V2.46 最新進度

V2.46 接入獵人 **Skill 56「馴服寵物」／`PROFESSION_DOCILE`**，把之前捕獲公式中尚無來源而固定為 0 的 `CHAR_WORKMODCAPTURE` 正式接回 fixed lifecycle。

fixed row：MP 10、TARGET 1（OTHER）、KIND 2、option `倍%2|次%2|攻%2|效%1`、command `BATTLE_COM_S_DOCILE`。

### 技能本體不讀 row 的倍／次／攻

`battle_profession_assist_fun()` 的 DOCILE case 直接把 display level 經 `PROFESSION_CHANGE_SKILL_LEVEL_A()` 轉成 A-tier 0～10，然後固定：

`rate = tier*2 + 10`

所以 power 為 **10～30**。row option 裡的 `倍%2|次%2|攻%2` 在這個 case 沒被讀取；Web 不拿它們自行製造傷害或額外次數。

### TARGET_OTHER 與實際受益者

固定 target enum 的 `OTHER` 定義包含自己。`BATTLE_MultiCaptureUp()` 收到 ToList 後又明確只處理 `CHAR_TYPEPLAYER`，並跳過死亡 Player。

目前 Web 一場戰鬥只建一個 Player Battle Entry（bid 0），因此 live 按鈕對 DOCILE 固定選自己 bid 0；其他既有職業技能仍沿用目前 Enemy selected target，不把 DOCILE 的特殊選法外溢。

### exact RAND 與累積

每個有效 Player 都做：

`UpPoint = RAND(power*0.9, power*1.1)`

fixed `RAND` macro 允許 0.9／1.1 產生小數邊界：內層 random width 先做 C `(int)`，macro 表達式最後再指定到 `int UpPoint`。V2.46 直接沿用既有 `sourceCRandMacroValue()`，最後再 `Math.trunc`，不改成一般整數 `cRand()`。

成功後：

`CHAR_WORKMODCAPTURE += UpPoint`

沒有 duration counter，也不會每回合衰減；同場重複施放會繼續累加。

### 捕獲公式與消耗時點

V0.91 已對齊的 `BATTLE_CaptureCheck()` 本來就有：

`WorkGet += CHAR_WORKMODCAPTURE`

V2.46 把原本 placeholder 0 改為 battle-local `battlePlayerCaptureMod`，因此畫面捕獲率與真正 `RAND(1,100) < WorkGet` 都會使用馴服加成，最後仍套既有 99 上限。

fixed `BATTLE_Capture()` 在真正執行捕獲時，不論 CaptureItemCheck／CaptureCheck 最後成功或失敗，都會把 `CHAR_WORKMODCAPTURE` 清 0。Web 因此只在 Player 真正走到 capture command 分支時清掉；若玩家在出手前死亡、C_WAIT 或被異常狀態阻止而根本沒進捕獲 case，加成仍保留。

Battle Entry 初始化本來也會清 `CHAR_WORKMODCAPTURE`，所以 V2.46 同步在 `resetBattleStatuses()` 歸零，不跨戰鬥保存。

新增 `tools/check_v246_profession_docile_runtime.mjs`，鎖住 Skill 56 metadata、A-tier 10～30、fractional RAND macro、Player-only target、累加、capture formula bridge、真正捕獲才清零、battle reset、V2.46 marker；**save schema 維持 30**。

## V2.45 最新進度

V2.45 接入獵人 **Skill 49「屍體掠奪」／`PROFESSION_PLUNDER`**，固定來源為 `battle_profession_attack_fun()` 的 `BATTLE_COM_S_PLUNDER`。

fixed row：MP 10、TARGET 10（DEATH）、KIND 2、option `效%1`、command `BATTLE_COM_S_PLUNDER`。

### 死亡目標與 EarthRound

`PLUNDER` 是 direct profession attack 裡唯一明確略過 generic `HP<=0` return 的技能，因此死亡目標仍可進 case。raw COM2 若是 EarthRound，則和其他 profession direct attack 一樣在 switch 前直接 return。

來源 callback 本身並沒有再次強制 `HP==0`；正常 client 由 TARGET_DEATH 限制選屍體。Web 保留 server-side 行為，不額外發明 HP gate。

### 掃描的不是只有指定屍體

原 C 先用 raw COM2 決定 side，再依：

`battle slot 0..9 / 10..19 -> 每名角色 ItemBox 10 格`

由小到大掃描。找到**同側第一件有效 existing item**就停止。因此拿到的物品可以來自同側另一名 Enemy；最後 `BATTLE_Exit()` 的仍是原本指定的 raw target，不是物品擁有者。

Web V2.45 依 `battleSlot -> enemyDrops.slot 1..10` 重建相同順序，且只接受 owner 仍為該 Enemy 的 existing item，避免已進一般 `battleGetItemPool` 的物品被重複取得。

### `CHAR_AddPileItem()` 原樣保留

這條路徑不是一般勝利掉落的 3 格 getitem reservoir，而是直接呼叫 `CHAR_AddPileItem()`：

- 玩家最大 pile = `轉生 + trunc(轉生/5)*2 + 3 + ITEM_ATTACHPILE`。
- 空背包容量不足以容納整個 `ITEM_USEPILENUMS`，或 pile<=0：直接 return -1。
- pile <= 玩家最大 pile：把原 existing item 放入第一個空背包格。
- pile > 玩家最大 pile：以相同 Item ID 逐份 `ITEM_makeItemAndRegist()`，每份重新消耗完整 make-item RNG，再只覆寫 `ITEM_USEPILENUMS`；最多 10 份。
- 全部分割品成功加入後才 end 原 existing item。

最重要的來源 bug：**PLUNDER 完全不檢查 `CHAR_AddPileItem()` 回傳值。** 就算滿包導致 -1，仍會顯示取得訊息、清掉 Enemy item slot，然後讓指定目標離場。V2.45 保留這個失敗後 orphan/end 的生命週期，不自行把物品還給屍體。

### Exit / reward 邊界

取得或找不到物品後都會直接 `BATTLE_Exit(defindex)`；`defindex` 是原指定 target。這條 case 沒有傷害、Counter、普通掉落抽選，也不把退出本身當成擊殺獎勵。

新增 `tools/check_v245_profession_plunder_runtime.mjs`，鎖住 Skill 49 runtime、死亡 raw target、EarthRound gate、同側 10×10 掃描順序、跨 Enemy 取物、AddPile pile/容量/分割規則、失敗仍 detach、只退出原 target、V2.45 marker；**save schema 維持 30**。

## V2.44 最新進度

V2.44 接入獵人 **Skill 50「毒素武器」／`PROFESSION_TOXIN_WEAPON`**。fixed 實作並不是「先給武器上毒 Buff，之後普通攻擊才帶毒」，而是施放當下立即依目前武器完成一輪自訂物理攻擊，然後每一個正傷害 hit 各自做一次中毒檢定。

fixed row：MP 5、TARGET 1、KIND 1、option `毒|前|成%20|敏%30|效%1|回%5`、command `BATTLE_COM_S_TOXIN_WEAPON`。

### 等級與中毒檢定

`battle_profession_status_chang_fun()` 一開始把 display level 經：

`PROFESSION_CHANGE_SKILL_LEVEL_A()`

轉為 A-tier 0～10。

毒成功率：

`Success = 20 + tier×2`

因此為 20～40%。

每一個真正算出正 damage 的 hit 都在：

`AttackSeq -> DamageSub -> WakeUp -> death -> ItemCrush`

之後，再呼叫一次 `PROFESSION_BATTLE_StatusAttackCheck()`。

這個 status helper 仍保留 fixed 規則：

- 先消耗 `RAND(1,100)`
- 之後才檢查死亡／已有其他 StatusTbl
- 成功條件是嚴格 `roll < Success`
- 目標已有任一 status 時會失敗

option `回%5` 最後寫入：

`StatusTbl[POISON] = 5 + 1`

所以 fixed stored turn = **6**。

### 它不使用普通 AttackCount

TOXIN_WEAPON 有自己的 custom attack loop，**完全不走普通 `BATTLE_GetAttackCount()`**。

因此各武器規則是：

- 一般近戰：只打 raw COM2 一次
- BOUNDTHROW：只打一個 raw target
- BREAKTHROW：只打一個 raw target；這條 custom branch 不走普通 BREAKTHROW 麻痺 tail
- BOW：直接用 `BATTLE_TargetListSet()` 建完整 `aBowW` target list，逐格打到 sentinel，沒有 AttackNum 上限
- BOOMERANG：直接取 raw COM2 所在 5 格 row，整排掃一次，傷害 ×0.3

也就是毒素武器拿弓時，可能一次對多個目標各自造成物理傷害並各自獨立判毒；這不是普通弓的 1～N AttackCount 行為。

### raw target 死亡的來源差異

`battle_profession_status_chang_fun()` 在進 TOXIN case 前：

- 會要求 raw COM2 對應到有效角色 index
- 會拒絕 raw target 的 EarthRound
- **不會因 raw target HP=0 就整招 return**

所以若 raw target 在玩家真正出手前已死亡：

- 近戰／投擲單目標：loop 看到死 target 後略過，實際 0 hit
- BOW：仍可依那個 raw slot 建 `aBowW`，打到 target list 裡其他活著的單位
- BOOMERANG：仍可依 raw slot 的 row 打到同排其他活著的單位

V2.44 因此把 TOXIN dispatcher 放在 generic 「target dead -> NoAction」之前，避免錯誤截斷這個 fixed 行為。

### EarthRound secondary target bug

fixed TOXIN loop 對 target list 裡每個後續目標只做：

- index valid
- HP > 0

**沒有再做 `BATTLE_TargetCheck()`**。

所以 raw COM2 本身若是 EarthRound，整招會先 return；但弓／回力鏢 target list 的「次要目標」即使正處於 EarthRound，只要角色仍存在且 HP>0，原 C 仍會把它送進 AttackSeq。

Web V2.44 為了保留這個來源 bug，secondary target lookup 使用 raw battle-slot lookup，而不是會排除 hidden/EarthRound 的一般 targetable helper。

### Guardian／DamageReact／SUITPOISON

這條 custom branch：

- 會正常做 GuardianCheck，而且 Guardian 會真正成為本次 DamageSub 的 defender
- 會正常保留 DamageReact
- 每個正 damage hit 都保留 WakeUp / ItemCrush
- **不會進普通 BATTLE_Attack 的 SUITPOISON**
- 完成後也**不進普通 Counter loop**

因此 Web 用 real Guardian + normal DamageReact，但明確 `suppressSuitPoison:true`。

新增 `tools/check_v244_profession_toxin_weapon_runtime.mjs`，鎖住 Skill 50 runtime、20～40% poison、stored turn 6、custom weapon target list、no AttackCount、dead raw target、secondary EarthRound、×0.3 boomerang、DamageSub/ItemCrush 後才判毒與 V2.44 marker；**save schema 維持 30**。

## V2.43 最新進度

V2.43 接入獵人 **Skill 47「陷阱」／`PROFESSION_TRAP`**，完整接上 fixed `battle_profession_assist_fun() -> BATTLE_ProfessionStatusSeq() -> BATTLE_GetDamageReact() -> BATTLE_DamageSub()` 的自體陷阱／反傷鏈。

fixed row：MP 11、TARGET 5、KIND 2、option `效%1|回%5`、command `BATTLE_COM_S_TRAP`。

### 施放時不是普通 status

原 C 先把技能 display level 經：

`PROFESSION_CHANGE_SKILL_LEVEL_M()`

轉成 M-tier 1～10：

- raw >90 → 10
- >80 → 9
- …
- >10 → 2
- 其他 → 1

陷阱真正保存兩個 Work：

- `WORKMODTRAP = tier×30 + 100`
- `WORKTRAP`：tier 1～4 = 1、tier 5～9 = 2、tier 10 = 3

所以固定傷害為 **130～400**。row 文字中的 `回%5` 並沒有直接當作陷阱剩餘回合；fixed assist case 明確用上述 tier 分段覆寫。

### ProfessionStatusSeq 的特殊倒數

陷阱不走一般 `StatusTbl[]`。

每次輪到 Player 進 `BATTLE_ProfessionStatusSeq()` 時：

- 若 `WORKTRAP > 0`：只做 `WORKTRAP--`。
- 若該次一開始就是 `WORKTRAP == 0`：才把 `WORKTRAP` 與 `WORKMODTRAP` 一起清零。

因此來源有一個很怪但明確的 lifecycle：

- `1 -> 0` 的那次 ProfessionStatusSeq 之後，陷阱**立即已失效**，因為 DamageReact 只看 `WORKTRAP > 0`。
- 但 `WORKMODTRAP` 的舊固定傷害值會多留到下一次 ProfessionStatusSeq 才被清掉。
- Web 保留這個「count 先失效、MOD 晚一回合清」的來源行為，不自行整理成一般 Buff timer。

### DamageReact：不是反彈原傷害

`BATTLE_GetDamageReact()` 的 fixed 順序為：

`VANISH -> ABSROB -> REFLEC -> TRAP -> ACUPUNCTURE`

目前 Web Player 可達的新反應是 TRAP。

當 Player 有 `WORKTRAP > 0` 且收到**正傷害的非投射物理攻擊**：

1. 原本算出的物理 damage 不再扣 Player。
2. `damage` 直接被改寫成 `WORKMODTRAP` 固定值。
3. 固定陷阱傷害改扣**攻擊者**。
4. `WORKTRAP` 與 `WORKMODTRAP` 立即清零。
5. `defindex` 在後續流程改成 attackindex，因此 WakeUp、後續 physical status target、ItemCrush 與死亡／Ultimate 判定都視攻擊者為受擊者。
6. `BATTLE_Attack()` 在一開始看到 DamageReact 就會把 `iRet/ContFlg` 關掉，所以陷阱觸發後不再進外層普通 Counter。

也就是：**陷阱不是「Player 先吃 77 再反 250」；而是「Player 這次不吃 77，攻擊者改吃固定 250」。**

### 投射武器不會踩陷阱

fixed `BATTLE_DamageSub()` 對 TRAP 額外檢查 `BATTLE_IsThrowWepon()`。

攻擊者使用：

- BOW
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW

時，`pRefrect` 會被改回 NONE：

- Player 正常承受該次攻擊。
- Trap **不觸發**。
- Trap **不消耗**。

MISS／DODGE／0 damage 也不會進 DamageSub 的 Trap 分支，因此同樣保留陷阱。

### Web 接入範圍

V2.43 把 Trap redirect 接到目前已有的實際物理入口：

- 普通 Enemy → Player 攻擊
- common weapon / AttackNum 多段
- common PetSkill physical
- Player／Enemy Counter
- Confusion 同／跨 side ordinary physical
- Combo 的 per-segment DamageReact
- Guardian 後的 actual target
- STATUSCHANGE 等「傷害後再附狀態」流程

特別是 status physical：Trap 觸發後，後續 status 會沿 fixed 的 `defindex=attackindex` 指向攻擊者，而不是錯上到被陷阱保護的 Player。

新增 `tools/check_v243_profession_trap_runtime.mjs`，鎖住 Skill 47 runtime、M-tier、130～400 固定傷害、1/2/3 count、MOD 延後清除、投射武器免疫、fixed damage redirect、Counter block、status/Combo/weapon 路徑與 V2.43 marker；**save schema 維持 30**。

## V2.42 最新進度

V2.42 接入獵人 **Skill 52「挑撥」／`PROFESSION_INSTIGATE`** 的完整 fixed StatusSeq → 普通 ATTACK lifecycle。這招不是命中後立即讓目標亂打；真正效果會等到被挑撥目標自己的 `BATTLE_StatusSeq()`。

fixed row：MP 17、TARGET 1、KIND 2、option `挑|成%20|敏%30|效%1|回%2`、command `BATTLE_COM_S_INSTIGATE`。

### 命中階段

- 命中率基礎 `20 + tier×4`，沿用 fixed `PROFESSION_BATTLE_StatusAttackCheck()`：先消耗 `RAND(1,100)`，再檢查死亡／既有異常，成功條件仍是嚴格 `roll < Success`。
- 一般 tier 0～9 使用 option `回%2`，因此 StatusTbl 寫入 `2+1=3`。
- fixed 原 C 對 **tier 10** 有額外特判：先把 turn 改成 4，因此實際 stored turn = **5**。
- 成功後保存 `WORKMODINSTIGATE = tier+10`，即 10～20%。
- 和樹根纏繞／天羅地網不同，Instigate **不在命中後立即清除 BATTLECOM1 的名單內**。因此若目標本輪尚未行動，原本已輸入的指令仍保留到它自己的 StatusSeq。

### StatusSeq 發作階段

目標輪到自己時先照 fixed 共用流程把 status turn 減 1；若因此歸零，直接解除，不再做挑撥判定。只要還有剩餘 turn：

1. 消耗 `RAND(1,100)`；`roll > 80` 不發作，亦不再抽目標。
2. `roll <= 80` 時把 COM1 強制改成普通 `ATTACK`。
3. 對**施術目標自己**的 `FIXSTR / FIXTOUGH / FIXDEX` 各乘 `(100-(tier+10))%`。
4. 這裡只改 FIX，不重建 `WORKATTACKPOWER / WORKDEFENCEPOWER / WORKQUICK`，也不重跑早已完成的 EntrySort。當次普通攻擊仍使用既有 WORK；但會心／反擊等後續若讀 FIXDEX，會看到這次降低後的值。
5. 接著固定消耗一顆 `RAND(0,9)`，從 **++pos** 開始循環掃自己 side 的 10 個 battle slot，排除自己，找第一個 `BATTLE_TargetCheck()==TRUE` 的同隊單位。
6. 找不到同隊目標時原 C 寫 `COM2=-1`。這時不提前找敵人；要等 `BATTLE_GetAttackCount()` 完成後，真正普通 ATTACK 執行到 `BATTLE_TargetAdjust()` 才由對面 side 的 `BATTLE_DefaultAttacker()` 再抽目標。

### 真正普通 ATTACK／武器鏈

因為挑撥發作後寫的是正式 `BATTLE_COM_ATTACK`，V2.42 沒有用「單發近戰」冒充。現在沿用目前 fixed Enemy 可達的完整自動武器規則：

- **BOW**：AttackCount 已先抽完；以挑撥寫入的 raw COM2 建原 `aBowW` target list，再消耗 BOW 的 `RAND(0,1)`。raw COM2=-1 時原 TargetListSet 不做 DefaultAttacker、也不抽 BOW RNG，該次直接 NoAction。
- **BOOMERANG**：普通 ATTACK 先轉 `BATTLE_COM_BOOMERANG`；傷害 ×0.3，Enemy 依固定 `k=4,j=-1` 反向掃 5-slot row。同 row 指到自己所在橫排時固定 NoAction；無有效 row target 才走對面 DefaultAttacker。
- **BOUNDTHROW / BREAKTHROW**：沿普通 common loop；BREAKTHROW 仍維持「命中 → 麻痺檢定 → ItemCrush → AddProfit」的來源順序。
- 其他目前 fixed Enemy 自動武器皆為單擊；仍走普通 Attack / Guardian / Counter 邊界。
- 投射武器本身會在 CounterCheck 最前面阻擋反擊，與既有來源規則相同。

新增 `tools/check_v242_profession_instigate_runtime.mjs`，鎖住命中、tier10 turn 特判、80% StatusSeq、FIX-only 降低、同 side ++pos RNG、COM2=-1 延後 TargetAdjust、以及四種遠距武器 command；**save schema 維持 30**。

## V2.41 最新進度

V2.41 接入獵人 **Skill 51「弱點攻擊」／`PROFESSION_ATTACK_WEAK`**，依固定原 C 的 `battle_profession_attack_fun()` 直接攻擊鏈實作，不把技能文字誤解成「降低敵人敏捷」。

fixed row：MP 9、TARGET 1、KIND 1、command `BATTLE_COM_S_ATTACK_WEAK`。真正輪到角色行動後：

- 若目標是 `CHAR_TYPEPET` 或 `CHAR_TYPEENEMY`，先把施術者目前的 `WORKATTACKPOWER` 乘上 `(110 + tier×2)%`；Web PVE 的職技目標是 Enemy，因此會進這個升攻分支。
- 接著改的是**施術者自己的** `WORKQUICK`：`WORKQUICK = FIXDEX × (90-tier)%`。原 C 沒有修改守方敏捷。
- `EntrySort` 在本輪更早已經完成，所以這次 WORKQUICK 改動**不會重排本輪出手順序**；但緊接著的 `BATTLE_AttackSeq() -> BATTLE_DamageCalc()` 會讀到這個較低的攻方 WORKQUICK，因此仍會影響本次物理傷害計算。
- 直接職技共用邊界不變：同隊目標先 NoAction；EarthRound 目標在 profession attack helper 內 NoAction；非 `CHAIN_ATK` 的 DamageReact 會被清掉；普通 `BATTLE_Attack()` 的 SUITPOISON 不會進，但 WakeUp / ItemCrush 等 generic hit 副作用保留。
- 不新增普通 Counter loop。
- `sourceProfessionSetPlayerAttackWork()` 保留 WORKATTACKPOWER 的本輪 mutation；WORKQUICK 則以 attacker override 精確送入緊接著的傷害計算，避免誤改 Enemy 狀態。

新增 `tools/check_v241_profession_attack_weak_runtime.mjs`，鎖住公式、目標類型、攻方 WORKQUICK、direct-profession hit boundary 與 V2.41 頁面標記；**save schema 維持 30**。

## V2.40 最新進度

V2.40 接入獵人 **Skill 46「樹根纏繞」／`PROFESSION_ENTWINE`** 與 **Skill 48「天羅地網」／`PROFESSION_DRAGNET`**，共用 pinned C 的 `battle_profession_status_chang_fun()`／`PROFESSION_BATTLE_StatusAttackCheck()` 骨架。

兩招共同規則：
- fixed status check 一進函式就先消耗 `RAND(1,100)`，之後才檢查目標死亡／既有 StatusTbl；已有任何異常時仍會吃掉這次 RNG。
- 成功條件是嚴格 `roll < Success`，不是 `<=`。
- Success 基礎值來自 option 的 `成%`，再加 `A-tier × 4`。
- 目標正在 EarthRound 時直接 Miss／NoAction，不 TargetAdjust。
- 成功後 source 寫 `StatusTbl[status] = turn + 1`，並立即把目標本輪 `BATTLECOM1` 清成 NONE。

### Skill 46 樹根纏繞
row option 為 `缠|成%40|敏%30|效%1|回%5`，因此：
- Success = `40 + tier×4`。
- status stored turn = 6。
- 命中後降敏百分比 = `30 + tier×4`。
- 來源只做一次 `FIXDEX = FIXDEX × (100-dex%)/100`，**不改 WORKQUICK**，也不重跑已完成的 EntrySort。
- 下一輪 `BATTLE_PreCommandSeq -> CHAR_complianceParameter()` 會重建 FIXDEX；原碼沒有依 ENTWINE status 重套降敏。
- `BATTLE_CanMoveCheck()` 沒有 ENTWINE，所以 stored status 本身不會讓後續回合持續不能行動。

### Skill 48 天羅地網
row option 為 `罗|成%30|效%1|回%2`：
- 初始 Success = `30 + tier×4`。
- 敵方目前已有恰好 1 個 Dragnet 時乘 `0.64` 並截整數；已有 2 個以上時乘 `0.4` 並截整數。
- status stored turn = 3。
- Dragnet 明確在 `BATTLE_CanMoveCheck()` 中回 FALSE，因此會真正阻止行動；倒數按角色自己的 StatusSeq 時點走。

Web 用 battle-turn marker 對齊「命中當下清除目標已輸入指令」：只取消同一輪尚未執行的 Enemy action，不回頭撤銷已經先行動完的目標。

新增 `tools/check_v240_profession_hunter_control_runtime.mjs`；**save schema 維持 30**。

## V2.39 最新進度

V2.39 接入勇士 **Skill 54「座騎攻擊」／`PROFESSION_CAVALRY`**，並嚴格依固定原 C build 的編譯結果實作，而不是照技能文字猜效果。

固定基準 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 `version.h` 明確開著：

`#define CAVALRY_DEBUG`

因此 `battle_profession_attack_fun()` 在 `BATTLE_AttackSeq()` 算完傷害後，實際走的是普通 `BATTLE_DamageSub()`；原碼中專門給座騎攻擊的 `BATTLE_PROFESSION_ATK_PET_DamageSub()` 被 `#else` 編譯掉，**這個 fixed build 不會使用「依 tier 把大部分傷害分到騎寵」的特殊分傷公式**。

V2.39 因此只接 fixed 真正可達的 direct-physical lifecycle：

- row 54：MP 11、TARGET 1、KIND 1、USE_FLAG 1、command `BATTLE_COM_S_CAVALRY`。
- command receipt 仍先扣 MP、再走一般職技熟練度。
- 回合執行走 `battle_profession_attack_fun()` 的直接攻擊類分支。
- 同隊目標照 fixed battle.c 先 NoAction；EarthRound 目標也直接 NoAction，不另找替代目標。
- 傷害本體沿用 `BATTLE_AttackSeq()`：閃避、Guardian 計算、暴擊、Guard、格檔、最低傷害等既有順序不變。
- 保留 profession helper 的 Guardian **calc-only** 舊 bug：Guardian 可被拿去算傷害，但實際 `DamageSub` 仍打原目標。
- 和其他非 `CHAIN_ATK` 的 direct profession 技相同，進 `BATTLE_DamageSub()` 前 DamageReact 被清掉；普通 `BATTLE_Attack()` 的 SUITPOISON 分支也不會進。
- ItemCrush／WakeUp 等 generic profession hit 既有副作用保留。
- 不接普通 Counter loop。

另外，Web 目前仍沒有正式 `CHAR_RIDEPET` 騎乘系統。原 C 的普通 `BATTLE_DamageCalc()` 若真的騎乘，會透過 `BATTLE_getRidePet()`／`BATTLE_adjustRidePet3A()` 把騎寵能力納入攻防；但 **Active Pet 並不等於 RidePet**，所以 V2.39 不會擅自把目前出戰寵當坐騎，也不新增假的騎乘數值。

新增 `tools/check_v239_profession_cavalry_runtime.mjs`，專門鎖住 `CAVALRY_DEBUG -> ordinary DamageSub` 這個固定 build 邊界；**save schema 維持 30**。

## V2.38 最新進度

V2.38 接入勇士 **Skill 43「二刀流」／`PROFESSION_DUAL_WEAPON`** 的固定原 C 裝備與 `ITEM_equipEffect()` lifecycle。

- `ITEM_getEquipPlace()`：只要技能欄存在 `PROFESSION_DUAL_WEAPON`，右手已有非弓武器且左手空時，第二把非弓武器可進 `CHAR_EQSHIELD`；右手是弓時不開左手。這個來源 branch 不另外檢查 profession class。
- 左手不是 `ITEM_WSHIELD` 時，`itemEffect[]` 內的攻防敏、HP/MP、運魅、迴避、異常抗性、會心、額外傷防、格檔、順序、AttachPile、命中、忽防，逐欄套 `rate = tier*3+20`%，每欄先做 C 整數截斷再累加。
- 若資料異常存在多個二刀流技能槽，fixed C 會逐槽重複累加；Web 也保留，不自行去重。
- `ITEM_MODIFYATTRIB / ITEM_MODIFYATTRIBVALUE` 在 fixed `ITEM_equipEffect()` 的倍率迴圈外，因此左手四屬性仍按 100% 原值計入。
- 戰鬥換裝改成保存 move 前的 source item，再於 move 完成後重新跑 `ITEM_getEquipPlace()`；只有 post-move 結果是 `CHAR_ARM` 才刷新 Avoid / Weapon Focus，完全跟 fixed `battle.c -> BATTLE_ProfessionStatus_init()` gate 對齊。
- Skill 43 不新增戰鬥按鈕：fixed callback 只 `return TRUE`，且 MP=0 row 會先被 `PROFESSION_SKILL_DEC_COST_MP()` 的 `dec_mp <= 0` gate 擋下。

典型 post-move source 時序也保留：第一把非弓武器裝入空右手後不 refresh；第二把裝入左手後 refresh；卸右手時 refresh；卸左手時不 refresh。

新增 `tools/check_v238_profession_dual_weapon_runtime.mjs`；**save schema 維持 30**。

## V2.37 最新進度

V2.37 接入勇士 **Skill 25「回避」／`PROFESSION_AVOID`** 的真正 fixed 被動閃避倍率，並補齊它非常反直覺的主動使用行為。V2.23 已經有「Player 普通物理成功 dodge 後嘗試增加 Skill 25 熟練度」；這一版補上 `CHAR_WORK_P_DUCK / CHAR_WORKMOD_P_DUCK` 對 `BATTLE_DuckCheck()` 的實際作用。

fixed row：TARGET=1、KIND=2、USE_FLAG=1、MP=0、option `回`，command 為 `BATTLE_COM_S_AVOID`。

### 被動 Work 在 Status_init 建立

`BATTLE_ProfessionStatus_init()` 進戰時先清：

`WORK_P_DUCK = 0`

`WORKMOD_P_DUCK = 0`

再掃職業技能欄。一般空／無效 slot 是 `continue`；找到 Skill 25 後要求 profession class 相符，否則該分支直接 `return`。

技能 display level 經 `PROFESSION_CHANGE_SKILL_LEVEL_A()` 轉 tier 0～10，來源公式是：

- tier 0～5：`mod = tier × 2`
- tier 6～10：`mod = (tier - 5) × 3`
- 上限 25

這代表來源有明顯不連續：**tier 5 = 10%，tier 6 反而掉成 3%**，之後為 6／9／12／15%。V2.37 不自行補 `+10`。

Status_init 在戰鬥中換武器時也會重新跑，所以換武器同時會重新抓當下 Skill 25 熟練度；單純靠成功閃避或主動按技能增加熟練度，不會立即改變目前 `WORKMOD_P_DUCK`。

### 它發生在 75% cap 之後

fixed `BATTLE_DuckCheck()` 的順序：

`base dodge → 全域修正／酒醉／Bow／NoGuard → ×100 → 75% cap → HITRIGHT → Profession Avoid → Chaos +40% → RAND(1,10000)`

其中 `BATTLE_check_profession_duck(int per)` 的參數是 **int**，但 caller 的 `per` 是 float，因此進函式前會先截斷，再做：

`per = int(per × (100 + WORKMOD_P_DUCK) / 100)`

而且之後**沒有再套 75% cap**。因此高閃避角色的 Skill 25 可以把已經封頂 7500 的 threshold 放大，例如 tier 5 的 10% 會得到 8250；若攻擊又是混亂攻擊，後面還會再乘 1.4，甚至可能超過 10000 而形成必閃。

即使 tier 0 的 mod=0，只要 Skill 25 active，來源仍會因 `int per` 參數發生一次截斷；V2.37 也保留。

### 主動按「回避」其實沒有 Buff

`PROFESSION_avoid()` 會正常寫 `BATTLE_COM_S_AVOID` 並回傳 TRUE，所以 packet receipt 的 MP／熟練度 lifecycle 仍成立。

但 pinned `battle.c` 把它送進 `battle_profession_assist_fun()` 後，該函式的 switch **完全沒有 `BATTLE_COM_S_AVOID` case**。因此真正輪到角色行動時沒有任何 active Buff／動畫效果。

V2.37 將 Skill 25 放進 battle command bridge，但 execution 明確 source NoAction；不把被動回避率錯做成「按下後才生效」。

新增 `tools/check_v237_profession_avoid_runtime.mjs`；**save schema 維持 30**。

## V2.36 最新進度

V2.36 接入 **Skill 26～32「武器專精」／`PROFESSION_WEAPON_FOCUS`** 的真正 fixed 傷害被動。V2.22～V2.23 已經有「物理暴擊時依武器種類增加對應專精熟練度」的 hook；這一版補上原 C 真正影響攻擊力的 `WORK_WEAPON / WORKMOD_WEAPON → FIXSTR` lifecycle。

對應固定武器／option：

- Skill 26 槍熟練度：ITEM_SPEAR=3 → `枪`
- Skill 27 斧熟練度：ITEM_AXE=1 → `斧`
- Skill 28 棍熟練度：ITEM_CLUB=2 → `棍`
- Skill 29 弓熟練度：ITEM_BOW=4 → `弓`
- Skill 30 精通回力鏢：ITEM_BOOMERANG=17 → `镖`
- Skill 31 精通投擲石：ITEM_BREAKTHROW=19 → `石`
- Skill 32 精通投擲斧：ITEM_BOUNDTHROW=18 → `投`

### Weapon Focus Work 不是每回合重算

fixed `BATTLE_ProfessionStatus_init()` 只在 Player 建立 Battle Entry 時，以及戰鬥中裝備武器後重新呼叫。

它先把：

`CHAR_WORK_WEAPON = 0`

`CHAR_WORKMOD_WEAPON = 0`

再掃完整職業技能欄；空欄／無效欄是 `continue`，與 V2.35 Reback 的 early-return bug 不同。

只有目前武器類型與 Skill OPTION marker 相符、且 profession class 相符時才建立 Work snapshot。技能後續因暴擊升熟練度**不會立刻改變當前傷害倍率**；必須重新進戰或戰鬥中換武器觸發 Status_init 才重建。

### 專精倍率

技能 display level 先走 `PROFESSION_CHANGE_SKILL_LEVEL_A()` 得到 tier 0～10：

- tier 0～5：`mod = tier×2 + old MYSKILLSTRPOWER`
- tier 6～10：`mod = (tier-5)×3 + 10 + old MYSKILLSTRPOWER`
- 只做上限 `mod <= 25`，來源沒有下限 clamp。

真正 compliance 時：

`FIXSTR = int(FIXSTR × (100 + WORKMOD_WEAPON) / 100)`

所以專精不是加暴擊率，而是直接乘 FIXSTR。

### 與激化／SetMagicPet 的來源交互

fixed `Other_DefcharWorkInt()` 的順序是：

`裝備/Suit → MYSKILLSTR → Weapon Focus → WEAKEN → WORKATTACKPOWER`

因此 V2.36 新增 Player FIXSTR bridge，讓一般攻擊與明確讀 `CHAR_WORKFIXSTR` 的 Skill 24 雙重攻擊都使用同一條順序。

另外，`CHAR_MYSKILLSTRPOWER` 在 STR 效果回合數歸零時**不會被清成 0**；只在 `BATTLE_BadStatusAllClr()` 進戰初始化時清掉。因此同一場戰鬥裡，即使激化／SetMagicPet STR 已過期，之後換武器重新建 Weapon Focus 仍可能讀到殘留 power。V2.36 用 battle-local raw Work mirror 保留這個來源怪行為。

### 戰鬥中換武器的先後順序

fixed `CHAR_moveEquipItem()` 是：

1. 先換裝；
2. 呼叫 `CHAR_complianceParameter()`；
3. 回到 battle.c 後，若這次物品是武器才呼叫 `BATTLE_ProfessionStatus_init()`。

所以換武器當下那次 compliance 仍使用**舊的 Weapon Focus Work**；Status_init 重建出的新專精倍率要到下一次 compliance 才真正進 FIXSTR。V2.36 保留此順序，不把新倍率ย้อนหลัง套到已完成的 compliance。

新增 `tools/check_v236_profession_weapon_focus_runtime.mjs`；**save schema 維持 30**。

## V2.35 最新進度

V2.35 接入勇士 **Skill 33「狀態回復」／`PROFESSION_REBACK`** 的 fixed 自動回復 lifecycle。這招名稱容易誤解：原 C **不會解除異常狀態**，而是在玩家仍處於指定異常時，每次輪到自己的 StatusSeq 自動回復 HP。

fixed row：TARGET=1、KIND=2、USE_FLAG=1、MP=0、option `HP%2`，command 為 `BATTLE_COM_S_REBACK`。

### 主動施放其實 NoAction

`PROFESSION_reback()` 只用 `profession_common_fun()` 寫入 `BATTLE_COM_S_REBACK`；但 pinned `battle.c` 的 profession command switch 沒有對應 case。因此主動點 Skill 33 仍保留 command-receipt proficiency，但真正輪到行動時 NoAction。

真正效果在每個 Player actor 的：

`BATTLE_StatusSeq → BATTLE_MagicStatusSeq → BATTLE_ProfessionStatusSeq → BATTLE_CanMoveCheck`

所以即使角色因麻痺／睡眠／石化等不能動，狀態回復仍先執行。

### 只認 9 個 fixed status

來源 `status_table[9]` 固定為：

- 麻痺
- 睡眠
- 石化
- 暈眩
- 樹根纏繞
- 天羅地網
- 冰爆
- 冰箭
- 雷附體

中毒、酒醉、混亂、虛弱、劇毒、魔障、沉默等都**不會**觸發 Skill 33。

而且判定發生在一般 StatusSeq 已經扣完回合之後；若某狀態在這次 StatusSeq 剛好歸零，就不會再拿它觸發回復。

### HP 回復公式

fixed 先把技能 display level 走 `PROFESSION_CHANGE_SKILL_LEVEL_M()`：

- 1～10 → tier 1
- 11～20 → tier 2
- …
- 81～90 → tier 9
- 91～100 → tier 10

回復比例為：

`min(20, tier × 2)% × WORKMAXHP`

使用 C int 截斷並封頂到最大 HP。即使 HP 已滿導致實際回復量為 0，只要指定異常仍存在，來源仍會呼叫 `PROFESSION_SKILL_LVEVEL_UP("PROFESSION_REBACK")`；V2.35 同樣保留。

### 技能欄 early-return bug

fixed `BATTLE_ProfessionStatusSeq()` 掃技能欄時是：

`if(Pskillid <= 0) return;`

不是 `continue`。因此掃描遇到第一個空／無效技能欄就整個停止，後面的 Skill 33 不會被找到。V2.35 新增專用 sequential scanner 保留這個來源邊界，不沿用一般「跳過空欄繼續找」的 helper。

新增 `tools/check_v235_profession_reback_runtime.mjs`；**save schema 維持 30**。

## V2.34 最新進度

V2.34 接入勇士 **Skill 53「格檔」／`PROFESSION_DEFLECT`** 與 fixed `BATTLE_ArrangeCheck()` 的受擊端 lifecycle，並保留來源中一個可完整證明的 bug。

fixed row：TARGET=1、KIND=2、USE_FLAG=1、MP=0、`FIX_VALUE=10`，command 是 `BATTLE_COM_S_DEFLECT`。

### 主動按技能：來源其實 NoAction

`PROFESSION_deflect()` 只呼叫 `profession_common_fun(..., BATTLE_COM_S_DEFLECT)` 寫入 command；但 pinned `battle.c` 的人物職技 switch **完全沒有 `BATTLE_COM_S_DEFLECT` case**。因此 Web 保留 command-receipt MP／post-dispatch proficiency，真正輪到行動時則 source NoAction，不自行發明主動格檔 Buff。

### tier+10 會被來源自己清掉

fixed `BATTLE_ProfessionStatus_init()` 先做 `WORKFIXARRANGE += tier + 10`，下一行卻立刻呼叫 `CHAR_complianceParameter()`；其中 `CHAR_initcharWorkInt()` 把 `WORKFIXARRANGE=0`，再由 `ITEM_equipEffect()` 只把裝備 `ITEM_MODIFYARRANGE` 加回，最後 `WORKARRANGEPOWER = WORKFIXARRANGE`。

所以 Skill 53 的 tier+10 **實際不會留下來**。有效 Arrange power 只來自裝備 `arr`／`ITEM_MODIFYARRANGE`；V2.34 不偷修這個來源 bug。

### BATTLE_ArrangeCheck

gate 順序照 fixed：原始 GUARD → DamageReact > 0 → 不能行動 → NODUCK → ABIO → power<=0，以上都不抽 Arrange RNG；其後 `per=min(ARRANGEPOWER,700)`，用 `RAND(1,1000) <= per`。因此成功率上限為 **70%**。

GUARD gate 讀的是原始 command，即使混亂令真正 GuardAdjust 無效仍阻止 Arrange；V2.34 新增 battle-local raw GUARD snapshot 保留此差異。

成功後 int damage 截成 10%，Player 守方同時觸發 `PROFESSION_SKILL_LVEVEL_UP(...,"PROFESSION_DEFLECT")`。若截斷成 0，最終 RET 由 ARRANGE 改成 MISS；若是 Guardian 重導則 NORMAL damage=1；正傷害保留 ARRANGE。

fixed `BATTLE_Attack()` 的 ARRANGE case 不會把 `iRet/ContFlg` 改成 FALSE，因此普通 Counter 仍可能繼續；但原本會排除 ARRANGE 的後置效果現在可真正讀到 `r.arranged`。

新增 `tools/check_v234_profession_deflect_arrange_runtime.mjs`；**save schema 維持 30**。

## V2.33 最新進度

V2.33 接入勇士 **Skill 34「舍已為友」／`PROFESSION_SCAPEGOAT`** 的完整 fixed Guardian lifecycle。

fixed row：TARGET=5、KIND=2、USE_FLAG=1、MP=5，option 為 `回%1`。技能走 `battle_profession_assist_fun()`，但來源實際並不是一般多回合 Buff：它直接改當輪 `BattleArray.Side[].Entry[].guardian` 與施術者的 `CHAR_BATTLEFLG_GUARDIAN`。

### Guardian mapping 只活到下一輪 PreCommand

fixed `BATTLE_PreCommandSeq()` 每輪先：

1. 將所有 Entry.guardian 清成 -1；
2. 清掉所有角色的 `CHAR_BATTLEFLG_GUARDIAN`；
3. 才跑 `CHAR_complianceParameter()` 重建 FIX／WORK。

因此舍己為友只保護**施放後的本輪剩餘攻擊**。玩家出手前已經發生的攻擊不ย้อนหลัง重導，下一輪開始前 mapping 也一定消失。

### tier 對應保護範圍

`PROFESSION_CHANGE_SKILL_LEVEL_A()` 後：

- tier 0～4：只把「自己人物對應的寵物 slot」guardian 指向玩家；
- tier 5～9：我方所有 Pet slots 5～9；
- tier 10：我方 10 個 Entry 除施術者本人之外全部指向玩家。

目前網頁 battle runtime 只有 Player slot 0 + 一隻 Active Pet slot 5，因此 V2.33 保存完整來源 slot plan，但只對場上真正存在的寵物 materialize Guardian，不虛構其他人物或寵物。

### 原目標先閃避，成功命中後才代擋

fixed `BATTLE_AttackSeq()` 順序是：

`DuckCheck(original target) → GuardianCheck() → critical/damage(new defender)`

所以敵人原本打寵物時：

- 寵物先跑自己的普通／技能回避；
- 寵物若已閃掉，玩家不會跳出來代擋；
- 只有未閃避時才檢查舍己為友；
- 代擋成功後不再讓玩家做第二次 dodge；
- critical／damage 改用玩家的當輪 WORK 防禦計算；
- 若 Guardian 重導後傷害結果 <=0，fixed 強制 NORMAL damage=1。

遠距／投擲武器（Bow／Boomerang／BoundThrow／BreakThrow）在 `BATTLE_GuardianCheck()` 直接失敗，因此不會被舍己為友攔截。

### 代擋後 Counter 關閉

普通 `BATTLE_Attack()` 在 Guardian>=0 時會把 `iRet/ContFlg` 設成 FALSE，所以這次攻擊後不進 common Counter loop。V2.33 將 Player Scapegoat Guardian 納入同一條 counter-block gate。

### FIXTOUGH 降低但當輪 WORKDEFENCEPOWER 不變

Skill 34 callback 還會做：

`tghPenalty = 30 - tier*2`

`FIXTOUGH = int(old FIXTOUGH * (70 + tier*2) / 100)`

也就是 tier0 為 70%、tier5 為 80%、tier10 為 90%。

但這個寫入發生在本輪 PreCommand 已經把 `FIXTOUGH` 複製到 `WORKDEFENCEPOWER` **之後**。來源沒有再次呼叫 `BATTLE_TurnParam`，所以：

- 普通物理 Guardian 傷害仍使用施放前的當輪 WORKDEFENCEPOWER；
- 同輪若有特殊函式明確讀 FIXTOUGH，會看到降低後的值；
- 下一輪 PreCommand 重新 compliance 後，這個 FIXTOUGH 暫時改值一起消失。

V2.33 用 battle-local `battlePlayerFixedToughWork` 分開保存 FIX 與 WORK，不把這個來源怪行為錯做成「當場降普通防禦」。

另外補齊 FIREKILL／BattleModel／common direct-attack 類 Pet 目標的真實 Guardian 重導；FallGround、Regret／AttackDamage 等 fixed caller-defindex bug 路徑仍刻意保持 calc-only，不被全域化。

新增 `tools/check_v233_profession_scapegoat_runtime.mjs`；**save schema 維持 30**。

## V2.32 最新進度

V2.32 接入勇士三個自我輔助戰鬥技能：

- Skill 35 **激化攻擊**／`PROFESSION_ENRAGE`
- Skill 36 **能量聚集**／`PROFESSION_ENERGY_COLLECT`
- Skill 37 **專注戰鬥**／`PROFESSION_FOCUS`

三招 fixed runtime 都是 TARGET=5（NONE → client 送自己的 battle No）、KIND=2、USE_FLAG=1；MP 分別為 20／10／9。它們走：

`battle_profession_assist_fun()`

不造成直接傷害，也沒有 ordinary Counter。

### Skill 35 激化攻擊

先用 `PROFESSION_CHANGE_SKILL_LEVEL_A()` 得到 tier 0～10，再寫：

- `MYSKILLSTRPOWER = tier×2+20`
- `MYSKILLTGHPOWER = -(tier×2+10)`
- tier 0～4：stored turns 3
- tier 5～9：stored turns 4
- tier 10：stored turns 5

效果不是施放瞬間直接重算能力；fixed 要等下一輪 `CHAR_complianceParameter → Other_DefcharWorkInt` 才進 WORK/FIX。

### Skill 36 能量聚集

fixed 寫：

- `MYSKILLTGHPOWER = tier×2+20`
- `MYSKILLDEXPOWER = tier×2+10`
- stored turns 同樣為 3／4／5。

來源註解與 client BD 封包都把 DEX 描述成「下降」，但真正存入 `MYSKILLDEXPOWER` 的值是**正數**。因此下一輪原 C 實際會把 QUICK 往上加；V2.32 保留這個來源 bug，不擅自改成負號。

### 三圍共同的 mtgh 基底 bug

fixed `Other_DefcharWorkInt()` 對 STR／TGH／DEX 三個欄位都不是用各自的能力當百分比基底，而是同一個 compliance 前保存的 `mtgh`：

`add = int(mtgh × MYSKILLxxxPOWER / 100)`

所以 STR 加成也用耐力基底、DEX 加成也用耐力基底。Web 新增 battle-local profession stat round snapshot，在 PreCommand 建立、角色自己的 StatusSeq 扣回合；狀態於 StatusSeq 歸零時，本輪已建立的 FIX snapshot 仍保留，到下一輪才真正消失。

### Skill 37 專注戰鬥的來源 bug

fixed callback沒有照 option 的 `命%200` 直接加命中，而只寫：

- `MYSKILLHIT = 2`
- `MYSKILLHIT_NUM = 100`

當下 `WORKHITRIGHT` **完全不增加**。之後它沿用 V2.28 已建立的 MYSKILLHIT compliance bug／StatusSeq lifecycle；到歸零時還會從當下 WORKHITRIGHT 減掉 100。V2.32 不把它修成一般理解的「命中 +100」。

### 與 SetMagicPet 的同欄互斥

原 C 的 SetMagicPet 與這組職業技共用 `CHAR_MYSKILLSTR/TGH/DEX`：

- 職業技能會無條件覆蓋自己寫到的同一欄；
- 若 profession STR/TGH/DEX 任一欄仍 active，後來的 SetMagicPet 會被原互斥 gate 擋掉；
- 已在本輪 PreCommand 建好的舊 snapshot 不會被施放當下ย้อนหลัง改寫。

新增 `tools/check_v232_profession_warrior_assist_runtime.mjs` 鎖定 35～37 runtime row、3/4/5 stored turns、mtgh 共同基底、Collect DEX 正號 bug、Focus 無即時命中加成、PreCommand／StatusSeq 順序與 SetMagicPet 互斥。**save schema 維持 30**。

## V2.31 最新進度

V2.31 新增勇士 **Skill 42「混亂攻擊」／`PROFESSION_CHAOS`** 的 live battle executor，完整保留 fixed source 的 WORK、閃避與追加目標 RNG 順序。

fixed row：TARGET=1、KIND=1、USE_FLAG=1、MP=28，option 為 `效%1|`。這招走一般職業直接攻擊：

`battle_profession_attack_fun() → BATTLE_AttackSeq()`

### WORKATTACKPOWER 與攻擊次數

進入技能後，fixed 只做一次：

`WORKATTACKPOWER = int(WORKATTACKPOWER × 70 / 100)`

它讀的是**當下 Work attack**，不是 FIXSTR；V2.30 建立的 battle-local Work mirror 因此繼續保留這個 70% 值到同輪結束。

總攻擊次數依 attack tier：

- tier 0～4：3 次
- tier 5～9：4 次
- tier 10：5 次

第 1 擊打原本指定目標，後面才進隨機追加段。

### 混亂攻擊專屬閃避倍率

fixed `BATTLE_DuckCheck()` 先完成一般 dodge、75% cap 與 HITRIGHT 修正，最後才對 Chaos 做：

`duck = int(duck + duck × 0.4)`

而且**不再 cap**。因此原本 7500 的 dodge threshold 會變成 10500，等同普通 dodge 判定必定成功。V2.31 把這個 1.4× 套在首擊與所有追加普通攻擊。

### 首擊與追加擊不是同一條傷害鏈

首擊仍在 `battle_profession_attack_fun()` 內：

- 保留 profession direct helper 的 calc-only Guardian bug；
- 非 CHAIN 的 DamageReact 被壓成 0；
- 沒有 SUITPOISON；
- 仍走 DamageSub、wake 與正傷害 ItemCrush；
- 不進 ordinary Counter。

追加擊則是真正的 `BATTLE_Attack()`：

- 使用已降到 70% 的 WORKATTACKPOWER；
- 使用 Chaos 1.4× ordinary duck；
- Guardian 是真正代擋；
- DamageReact、SUITPOISON、ItemCrush 都照普通物理攻擊；
- profession 外層仍不執行 ordinary Counter。

### 追加目標 RNG：先整批抽完

fixed 並不是「打一拳才抽下一隻」。首擊完成後會先建立同側所有存活 slot，再把剩餘 N-1 個目標**一次全部抽完**：

- replacement 抽取，所以同一隻可以被抽中多次；
- 先消耗完這批 target RNG，才開始追加攻擊的傷害 RNG；
- 若某個預抽目標在輪到它前已死亡，或它處於 EarthRound，會丟棄尚未執行的預抽結果；
- 接著重建目前存活清單，並把「剩餘全部攻擊」重新整批抽一次。

來源候選清單刻意沒有先排除 EarthRound。若最後只剩 EarthRound 存活單位，原 C 會在重抽迴圈中無限循環；Web 保留此 source bug 的判定結果，但以 `sourceInfiniteLoop: earthround-only-candidate-pool` 安全中止，避免瀏覽器真的卡死。

新增 `tools/check_v231_profession_chaos_runtime.mjs`，鎖定 Skill 42 row、70% Work、3/4/5 hit count、Chaos dodge 1.4× 的時序、整批 target RNG、invalid-target 全批重抽、首擊／追加擊差異與 infinite-loop guard。**save schema 維持 30**。

## V2.30 最新進度

V2.30 新增勇士 **Skill 41「回旋攻擊」／`PROFESSION_CONVOLUTE`**，同時補齊 profession callback 對玩家 **WORKATTACKPOWER** 的同輪生命週期。

fixed row：TARGET=8、KIND=1、USE_FLAG=1、MP=28，option 第一欄同樣是 `无`，因此這招和 V2.29 貫穿攻擊共用：

`battle_profession_attack_magic_fun() → PROFESSION_MAGIC_ATTAIC()`

而不是一般 `BATTLE_Attack()`。

### 列目標與 fallback

client TARGET=8 會送 row pseudo toNo：

- 23：敵方後排 10～14
- 24：敵方前排 15～19

fixed `BATTLE_MultiList()` 會先掃該排：

- 該排有活人 → 保留原 row pseudo
- 該排全空，但另一排有活人 → 自動 fallback 到另一排，並把 COM2 改成新的 row pseudo
- 兩排都沒有活人 → 失敗

之後 `PROFESSION_MAGIC_TOLIST_SORT()` 會重新按 battle slot 由小到大列出該排所有存活目標，最多 5 人；沒有額外隨機抽人。

### 每個目標的 WORKATTACKPOWER 連乘

`BATTLE_PROFESSION_CONVOLUTE_GET_DAMAGE()` 不是每個目標都從 FIXSTR 重新算。

它對每個「通過 profession magic dodge」的目標執行：

`WORKATTACKPOWER = int(WORKATTACKPOWER × (50 + tier×2) / 100)`

所以：

- tier0：每人再乘 50%
- tier5：每人再乘 60%
- tier10：每人再乘 70%

而且是**逐目標連乘**。例如當下 WORK attack=100、tier5、同排三人都通過 magic dodge：

`100 → 60 → 36 → 21`

來源沒有在每一人之間恢復原攻擊力。

如果某目標在 profession magic dodge 階段就 miss，該人不會觸發這次 WORK attack 降低。

### 同輪 WORK attack 現在正式保留

fixed callback 改過 `CHAR_WORKATTACKPOWER` 後，這個 Work 值會一直留到下一輪 `BATTLE_PreCommandSeq() → CHAR_complianceParameter/BATTLE_TurnParam` 才重建。

Web 因此新增 battle-local `battlePlayerAttackWork`：

- 下一輪 PreCommand 自動清回 compliant attack；
- 戰鬥結束清除；
- 不寫 save。
- `playerBattleView().attack` 在本輪有 Work override 時會讀這個值。

這除了讓回旋攻擊逐人連乘正確，也補正之前兩招的同輪後續語意：

- Skill 24 雙重攻擊：真正普通攻擊前寫入的 boosted WORKATTACKPOWER 現在會保留到本輪結束；
- Skill 38 盾擊：tier≠10 的 50% WORKATTACKPOWER 現在同樣會保留到本輪結束。

因此若玩家在自己職技行動後、同輪稍晚又因 Enemy 攻擊觸發反擊，反擊會使用 fixed 當下的 WORK attack，而不是錯誤回到 round baseline。

### 回旋攻擊的 profession-magic pipeline

和貫穿攻擊相同：

1. `PROFESSION_MAGIC_GET_PRACTICE()` 對 Convolute 沒有 power case，但仍固定吃：
   - `RAND(1,100)`
   - `rand()%100`
   - hp_power=0，所以不吃 variance RNG。
2. 每個目標先跑 `PROFESSION_MAGIC_DODGE()`。
3. 通過後先降低 WORKATTACKPOWER。
4. 專用物理傷害仍是 **critical-before-duck**：
   - critical 成功直接 `BATTLE_CriDamageCalc()`
   - 非 critical 才跑 `BATTLE_DuckCheck()`
   - 沒有第二層 SUIT dodge
   - 沒有 Weapon Focus / Dual Weapon critical proficiency hook。
5. raw physical power 再走 `UN_POW_M`。
6. `PROFESSION_MAGIC_CHANGE_STATUS()` 雖沒有 Convolute case，仍固定吃 leading `RAND(1,100)`。
7. `PROFESSION_MAGIC_CHANG_STATUS()` 對 Convolute 沒有額外倍率，所以直接扣該 damage。

同樣**不經** Guardian、GuardAdjust、DamageSub、DamageReact 消耗、ItemCrush、SUITPOISON、ordinary Counter、ordinary physical Ultimate。

fixed tail 也同樣會喚醒每個通過 profession magic dodge 的目標，即使內層物理 dodge 最終傷害為 0。

新增 `tools/check_v230_profession_convolute_runtime.mjs`，鎖定 row fallback、slot 順序、逐人 WORK attack 連乘、同輪 Work 保留、shared critical-before-duck pipeline，以及 Skill 24／38 的 Work persistence 修正。**save schema 維持 30**。

## V2.29 最新進度

V2.29 新增勇士 **Skill 39「貫穿攻擊」／`PROFESSION_THROUGH_ATTACK`** 的 live battle executor。

這招雖然是勇士攻擊技能，但 pinned fixed source 並不是走一般 `BATTLE_AttackSeq()`；它走：

`battle_profession_attack_magic_fun() → PROFESSION_MAGIC_ATTAIC()`

再於其中呼叫專用的 `BATTLE_PROFESSION_THROUGH_ATTACK_GET_DAMAGE()`。V2.29 依這條實際路徑移植，不把它簡化成兩次普通攻擊。

### Target / 前後排

fixed row：TARGET=1、KIND=1、USE_FLAG=1、MP=21，option 第一欄是 `无`，因此 magic type = -1。

- 直指 0～19 時先經 `__ATTACK_MAGIC BATTLE_MultiList()`。
- 如果原 COM2 目標已死亡／不在可攻擊 Battle Entry，但同側還有活人，來源會用 **`rand()%10` 反覆抽 packed alive list**，直到抽到不是 -1 的位置；Web 保留這個 RNG 生命週期。
- Through 再把實際 COM2 配成同欄前後排：
  - 10↔15、11↔16、12↔17、13↔18、14↔19。
- 兩者都活著時，fixed `PROFESSION_MAGIC_TOLIST_SORT()` 永遠輸出 **前排 15～19 → 後排 10～14**，不看玩家原本點前排還是後排。
- 若配對格不存在，只打一人。
- 一個特殊來源 bug：傷害倍率看的是迴圈 index `no`，不是實際前／後排。因此只剩一個後排目標時，它仍然是 index 0，會吃「第一段／前排倍率」。

### 固定 RNG 順序

在真正逐目標處理之前，`PROFESSION_MAGIC_GET_PRACTICE()` 對 Through 雖然算出的 `hp_power=0`，仍固定消耗：

1. `RAND(1,100)`（unused critical）
2. `rand()%100`（M2_POW 判定）
3. 因為 hp_power=0，所以不吃後面的 `RAND(98,102)`

每個目標則先跑 `PROFESSION_MAGIC_DODGE()`：

- 一進函式先吃 `RAND(1,100)`；
- EarthRound 隱身是在這顆 RNG **之後**才 early return；
- Enemy 走非 Player 分支，magic dodge luck = `int(LV×0.15)`，最多 20；
- `roll <= luck` 為 magic miss。

只有通過 magic dodge 的目標才進後面的 Through physical chain。

### tier < 10 的 HITRIGHT 來源行為

`BATTLE_PROFESSION_THROUGH_ATTACK_GET_DAMAGE()` 之前，fixed source 對 tier≠10 每個通過 magic dodge 的目標都執行一次：

- `MYSKILLHIT = 1`
- `MYSKILLHIT_NUM = -70`
- `WORKHITRIGHT -= 50`

所以兩個貫穿目標都通過 magic dodge 時，第二人做物理閃避判定前，玩家 WORKHITRIGHT 已比原值少 **100**。

這會覆寫／共用 V2.28 已移植的 `MYSKILLHIT` lifecycle；下一輪 StatusSeq 歸零時，fixed 會做：

`WORKHITRIGHT -= (-70)`

也就是反向 **+70**。裝備 HITRIGHT 導致 MYSKILLHIT 倒數異常延長的原 C bug 同樣繼續成立。

tier=10 則完全不寫這三個 Work 值。

### 專用物理傷害鏈

fixed `BATTLE_PROFESSION_THROUGH_ATTACK_GET_DAMAGE()` 的順序和普通 AttackSeq 不同：

1. **先** `RAND(1,10000)` 做 critical。
2. 若 critical 成功：
   - 直接 `BATTLE_CriDamageCalc()`
   - **不做普通 BATTLE_DuckCheck**
   - 即使拿弓也沒有一般 AttackSeq 的 bow critical 例外
   - 不觸發 Weapon Focus／Dual Weapon critical 熟練度 hook，因為那些 hook 在 `BATTLE_AttackSeq()` 裡。
3. 若 critical 失敗：
   - 才做 `BATTLE_DuckCheck()`
   - 這裡沒有 AttackSeq 的第二層 SUIT WDUCKPOWER dodge。
4. 若目標正在 GUARD、不能行動或已有 DamageReact，fixed `BATTLE_DuckCheck()` 會直接視為「不能閃」；但 Through 之後又**完全不做 GuardAdjust / DamageSub**，因此 GUARD 不會對這招做一般防禦減傷，DamageReact 也不會被消耗。

內層物理 raw damage 後，fixed 還會走 `UN_POW_M` 的 profession magic power reduction；magic type=-1 沒有額外元素熟練／抗性倍率。

接著 `PROFESSION_MAGIC_CHANGE_STATUS()` 對 Through 沒有 case，卻仍會先固定再吃一顆 **`RAND(1,100)` unused RNG**。

最後倍率：

- index 0：`(70 + tier×2)%`
- index 1：`(50 + tier×2)%`

所以 tier0 為 70% / 50%，tier10 為 90% / 70%。

### 這招明確不走的普通物理系統

Through Attack 最後直接扣 HP，因此 pinned source 不經：

- Guardian
- GuardAdjust
- `BATTLE_DamageSub()`
- DamageReact 消耗／反射
- ItemCrush
- SUITPOISON
- ordinary Counter
- ordinary physical Ultimate 判定

另外 fixed tail 會對所有「通過 profession magic dodge」的目標呼叫 `BATTLE_DamageWakeUp()`。所以即使內層物理 `BATTLE_DuckCheck()` 成功、最終傷害是 0，**睡眠仍會被解除**。Web V2.29 同步保留。

這輪也修正 `sourceProfessionEnemyByBattleSlot()` 的單隻 Enemy 路徑，讓非 group battle 的 battleSlot 10 同樣能使用既有職業戰鬥技能。

新增 `tools/check_v229_profession_through_attack_runtime.mjs`，鎖定 dead-target 重選、front→back 配對、practice 無效 RNG、magic dodge、每人 -50 HITRIGHT、critical-before-duck、UN_POW_M、unused status RNG、單後排 index0 倍率，以及整條 no Guardian／DamageSub／ItemCrush／Counter 路徑。**save schema 維持 30**。

## V2.28 最新進度

V2.28 新增勇士 **Skill 40「瀕死攻擊」／`PROFESSION_DEAD_ATTACK`**，並在重新審核 fixed generic profession direct helper 時修正 DamageReact 的來源差異。

### Skill 40 瀕死攻擊

fixed row：TARGET=1、KIND=1、USE_FLAG=1、MP=17，option = `命%82|HP%10|倍%2|效%1|回%3`。

- HP 條件在**角色真正執行技能時**檢查，不在 command receipt：
  - 若當下 `HP <= 10`，callback 直接 return，沒有攻擊效果；
  - MP 與 post-dispatch 熟練度早已依 fixed protocol 在收到 `P|slot|toNo` 時處理，不退款。
- tier 沿用 `PROFESSION_CHANGE_SKILL_LEVEL_A()`。
- 執行時先計算：
  - `rate = tier*2 + 10`
  - `HP = int(currentHP * rate / 100)`
  - tier0 留 10% 當下 HP，tier10 留 30%。
- 命中 Work：
  - `hit = tier*2 + 80`
  - 當下 `WORKHITRIGHT += hit`
  - `MYSKILLHIT = 1`
  - `MYSKILLHIT_NUM = hit`
  - 因此這次攻擊使用 +80～100 的 HITRIGHT。
- HP 犧牲與 HITRIGHT 寫入都發生在本次 `BATTLE_AttackSeq()` 前。

### MYSKILLHIT 的 fixed source bug

這不是單純「命中 Buff 一回合」。

下一輪 fixed `BATTLE_PreCommandSeq()` 會先跑 `CHAR_complianceParameter()`：

1. `CHAR_initcharWorkInt()` 把 `WORKHITRIGHT` 重建；
2. `ITEM_equipEffect()` 只重新加回裝備 HITRIGHT；
3. `MYSKILLHIT / MYSKILLHIT_NUM` 本身沒有被 compliance 清掉；
4. `Other_DefcharWorkInt()` 有一段來源欄位 bug：
   - `mpower = MYSKILLHIT`
   - `mdef = WORKHITRIGHT`
   - `mpower += (pre-suit FIXTOUGH * mdef) / 100`
   - 最後把結果**寫回 MYSKILLHIT 倒數**。

所以：

- 沒有 HITRIGHT 裝備時，下一輪 compliance 把 WORKHITRIGHT 重建為 0，MYSKILLHIT 仍為 1；
  接著 `BATTLE_StatusSeq()` 把倒數 1→0，並執行 `WORKHITRIGHT -= MYSKILLHIT_NUM`；
  因而該次行動會短暫得到 **-80～-100 HITRIGHT**。再下一輪 compliance 才恢復正常裝備值。
- 若裝備 HITRIGHT 不為 0，`pre-suit FIXTOUGH * equipment HITRIGHT / 100` 可能錯誤加進 MYSKILLHIT，將原本的 1 回合倒數延長，甚至反覆延長。Web 保留這個 fixed 行為，不改成合理化 Buff。
- Web 新增 battle-local `battlePlayerProfessionHitState`，只鏡像這組 WORK lifecycle；戰鬥結束即清除，不寫入存檔。
- `playerBattleView().hitRight` 現在在該 Work 存在時讀實際 transient WORKHITRIGHT，因此本次攻擊、同輪後續物理事件、以及下一輪來源 bug 都會走既有 `BATTLE_DuckCheck` 的 HITRIGHT RNG。

### generic profession DamageReact audit

重新核對 fixed `battle_profession_attack_fun()`：

- `BATTLE_GetDamageReact(defindex)` 雖先讀出 ReactType；
- 但 **只有 `BATTLE_COM_S_CHAIN_ATK` 會保留 react**；
- 其他 generic direct profession skill 都把 local `react` 清回 0，再進 `BATTLE_DamageSub()`。

因此 V2.28 同步修正：

- Skill 23 連環攻擊第一擊：仍可觸發／消耗 ACUPUNCTURE。
- Skill 22 暴擊第一擊：不再錯誤觸發 ACUPUNCTURE。
- Skill 40 瀕死攻擊：同樣忽略並保留 ACUPUNCTURE。
- Skill 24 雙重攻擊走的是後續真正普通 `BATTLE_Attack()`，不受此 generic helper 規則影響。
- Skill 38 盾擊位於 status-change helper，來源遇 DamageReact 會走另一條邏輯，也不套這個規則。

瀕死攻擊本身仍保留 profession calc-only Guardian bug、無普通 SUITPOISON、無 ordinary Counter。

新增 `tools/check_v228_profession_dead_attack_runtime.mjs`，鎖定 HP gate／HP 10～30% 公式、HITRIGHT +80～100、MYSKILLHIT compliance/status lifecycle、負 HITRIGHT bug、裝備 HITRIGHT 延長倒數 bug，以及 generic direct DamageReact 只有 CHAIN_ATK 保留。**save schema 維持 30**。

## V2.27 最新進度

V2.27 新增勇士 **Skill 38「盾擊」／`PROFESSION_SHIELD_ATTACK`** 的 fixed live battle executor。

- fixed row：TARGET=1、KIND=1、USE_FLAG=1、MP=5、option = `晕|成%30|效%2|回%2`。
- command receipt 仍沿用 V2.25：先扣 MP、跑 post-dispatch 熟練度；**盾牌條件不是在按下技能時檢查，而是等角色真正輪到執行時才檢查**。因此若當下沒有 `ITEM_WSHIELD`，技能不產生戰鬥效果，但 MP／熟練度已依 fixed protocol 處理。
- 盾牌 gate 對應 fixed `CHAR_EQSHIELD`，Web 使用玩家裝備 slot 6，且 existing item 的 `ITEM_TYPE` 必須為 **25 / ITEM_WSHIELD**。
- fixed 攻擊力規則：
  - tier = 10：保留當下 `WORKATTACKPOWER`；
  - tier ≠ 10：`WORKATTACKPOWER = int(WORKATTACKPOWER × 0.5)`。
  - 這裡用的是**當下 WORK attack**，不是 Skill 24 的 FIXSTR 重建公式。
- 盾擊仍走 `BATTLE_AttackSeq`，但 caller 沒把 Guardian output 寫回 `defindex`，因此沿用 profession 的 **Guardian calc-only bug**。
- 盾擊專用暈眩不是一般 `battleStatusChance()`。它用 fixed `PROFESSION_BATTLE_StatusAttackCheck()`：
  1. 一進函式先抽 `RAND(1,100)`；
  2. 之後才檢查目標死亡／已有異常；
  3. 判定是嚴格 `roll < Success`；
  4. 不使用一般 level／VITAL／status resist 公式。
- Success = `30 + tier×4`，所以 tier0=30、tier10=70。
- fixed option `回%2` 最後寫入的是 `turn + 1 = 3`。由於原 `BATTLE_StatusSeq()` 先依舊值判斷不能行動、再遞減，因此這是來源實際儲存值，不自行改成 2。
- 狀態 RNG 位於 **DamageSub / death 判定 / ItemCrush 之後**；只有本次 AttackSeq 結果是 NORMAL／CRITICAL 才會進狀態判定。MISS／DODGE 不抽盾擊暈眩 RNG。
- 成功暈眩時 fixed 會把目標 `CHAR_WORKBATTLECOM1 = BATTLE_COM_NONE`；Web 同步清除 Enemy 本輪 guard flag，並由現有 dizzy 狀態阻止後續行動。
- 此專用 profession branch 不走普通 `BATTLE_Attack()` 的 SUITPOISON，也不接 ordinary Counter loop。
- 戰鬥面板現在可顯示已學會的 22 暴擊、23 連環攻擊、24 雙重攻擊、38 盾擊。

新增 `tools/check_v227_profession_shield_attack_runtime.mjs`，鎖定盾牌 gate、tier 10 例外、50% WORK attack、strict `RAND < Success`、dead/existing-status 仍先吃 RNG、stored dizzy turn=3、ItemCrush-before-status 與 no Counter。**save schema 維持 30**。

## V2.26 最新進度

V2.26 繼續接勇士 direct-attack profession skill，新增 **Skill 24「雙重攻擊」／`PROFESSION_CHAIN_ATK_2`** 的完整 fixed battle lifecycle。

- fixed row：TARGET=1、KIND=1、USE_FLAG=1、MP=13、common command = `BATTLE_COM_S_CHAIN_ATK_2`。
- command receipt 沿用 V2.25：收到 `P|slot|toNo` 時先扣 MP、跑 post-dispatch 熟練度；真正效果等 Player actor 輪到時才執行。
- 這招和 Skill 23「連環攻擊」不是同一條邏輯。fixed `battle_profession_attack_fun()` 的實際順序是：
  1. 讀原目標 `WORKDAMAGEABSROB / WORKDAMAGEVANISH / WORKTRAP`；
  2. ABSROB > 0 則 -1、VANISH > 0 則 -1、TRAP > 0 直接清 0；REFLEC 那行在 fixed source 被註解，因此**不消耗 REFLEC**；
  3. 先把攻方 `WORKATTACKPOWER=0`，送出一段 **0 傷害技能動作**；
  4. 再算 `WORKATTACKPOWER = FIXSTR × (100 + tier×2)%`；
  5. 若攻方與原目標仍存活，對同一 raw `defNo` 呼叫**一次真正普通 `BATTLE_Attack()`**；
  6. helper 立即 return，不再走 profession calc-only 第一擊，也不進普通 Counter loop。
- Web 的 `FIXSTR` 映射使用現有 `playerEquipCompliance.fixedAttack`，不是當下可能已被 WEAKEN／MagicPet 改過的 `WORKATTACKPOWER`。
- tier 仍沿用 `PROFESSION_CHANGE_SKILL_LEVEL_A()`：例如 FIXSTR 100 時 tier0=100、tier1=102、tier5=110、tier10=120；保留 C 整數截斷。
- 現行 source-backed Enemy DamageReact 實際可達的只有 **ACUPUNCTURE**。CHAIN_ATK_2 原碼只預消耗 ABSROB／VANISH／TRAP，不包含 ACUPUNCTURE；因此 V2.26 不虛構尚不存在的三個 runtime counter，ACUPUNCTURE 保持不動，交給後面的普通 `BATTLE_Attack()` 正常處理。
- 真正那一下是普通 `BATTLE_Attack()` 路徑，所以保留 real Guardian substitution、SUITPOISON、ItemCrush 等普通物理命中規則；但 profession case 本身 break，因此**不補 ordinary Counter**。
- 戰鬥技能面板現在可顯示已學會的 22 暴擊、23 連環攻擊、24 雙重攻擊。

新增 `tools/check_v226_profession_chain_atk2_runtime.mjs`，鎖定 Skill 24 runtime row、FIXSTR 公式與 C 截斷、0 傷害前段、DamageReact 預消耗邊界、真正普通攻擊、AttackCount 仍先消耗、以及 no-Counter。**save schema 維持 30**。

## V2.25 最新進度

V2.25 把 V2.24 刻意保留 unresolved 的 fixed **profession TARGET / KIND / battle toNo** 正式閉環，並接入第一批真正能從玩家戰鬥指令施放的職業技能。server 行為仍以固定 `gavinlinasd/StoneAge@1f90cb6...` 為唯一規則基準；client 對照使用 `anson1788/stoneage@1997fc20456dbda36d181b9680ae10bed2e9cdf9` 只用來確認 server 傳給 client 的 TARGET / KIND UI 語意與實際封包轉換。

- fixed client 的 **KIND** 已確認：`1 = BattleSkill`、`2 = AssitSkill`、`3 = AdvanceSkill`。Web 只保存這個來源分類，不另造新 enum。
- fixed profession **TARGET 直接沿用 PetSkill target enum 0～10**：
  - 0 自己、1 單一其他目標、2 我方全體、3 敵方全體、4 全體、5 無目標；
  - 6 其他且不含自己、7 不含自己與自己的 Pet、8 單排、9 單線、10 死亡目標。
- fixed client → server 的 `toNo` 已完整鎖定：
  - 場上實體單位直接用 **0～19**；
  - side/all pseudo target：20=Side0、21=Side1、22=All；
  - row pseudo target：23=Side1 後排、24=Side1 前排、25=Side0 前排、26=Side0 後排。
  - Player `BattleMyNo=0` 時，TARGET=3 敵方全體會送 21；TARGET=2 我方全體送 20。
  - TARGET=8 單排依實際點到的格子轉換：0～4→26、5～9→25、10～14→23、15～19→24。
- `sourceProfessionBattleCommandPlan()` 現在可依 TARGET + 玩家實際選取格自動得到真正 `P|slotHex|toNoHex`；仍保留 explicit `toNo` 路徑供 protocol fixture 使用。
- live command lifecycle 依 fixed `PROFESSION_SKILL_Use()` 保留：**收到技能指令時先扣 MP、立刻跑 callback 後熟練度；真正 battle command 到角色回合才執行**。因此玩家之後若在輪到自己前死亡、睡眠／麻痺而失去行動，已扣 MP 不會退款，熟練度事件也不倒退。
- V2.25 第一批 live battle profession skills：
  - **Skill 22 暴擊 / `PROFESSION_BRUST`**
  - **Skill 23 連環攻擊 / `PROFESSION_CHAIN_ATK`**
- Skill 22 保留 fixed source 的反直覺 bug：helper 把 `CHAR_WORKFIXSTR` 改成 `FIXSTR × (100 + tier×3)%`，但緊接著的 `BATTLE_DamageCalc()` 讀的是 `CHAR_WORKATTACKPOWER`；所以這次攻擊**不會因該行 FIXSTR 寫入而增傷**。Web 不把它「修好」成不存在的傷害倍率。
- Skill 23 保留 exact tier / RNG：
  - display Lv 10→tier0、11～20→1、…、91～99→9、100→10；
  - 若 tier 不是 10 的倍數，連擊判定前先 +1；
  - 第二擊機率 = `tier × 5 + 15`，範圍 15%～65%；
  - **`RAND(1,100)` 在第一擊 AttackSeq 之前消耗**；
  - 成功時只對同一個 raw `defNo` 再呼叫一次普通 `BATTLE_Attack()`，且要求攻方／原目標第一擊後仍存活。
- profession 第一擊保留 `battle_profession_attack_fun()` 的 **Guardian calc-only bug**：Guardian 可替傷害計算提供防禦／會心資料，但 caller 沒把 `defindex` 換成 Guardian，因此 DamageSub／WakeUp／死亡／ItemCrush 仍落在原目標；第一擊也沒有普通 `BATTLE_Attack()` 的 SUITPOISON 分支。Skill 23 第二擊才是完整普通 `BATTLE_Attack()` Guardian substitution。
- profession direct-attack case 執行完就 `break`，不會進 ordinary common Counter loop；Web 同樣不替 Skill 22／23 補普通 Counter。
- 戰鬥畫面新增「職業戰鬥技能」區，只顯示**玩家已學會且 V2.25 已完成 live executor** 的技能；其餘已學職技繼續 fail-closed，不用一個泛化 handler 假裝都能施放。

新增 `tools/check_v225_profession_battle_runtime.mjs`，鎖定 KIND/TARGET、0～19／20～26、row mapping、tier boundary、command-receipt lifecycle、BRUST fixed bug、CHAIN RNG 次序與 no-Counter。**save schema 維持 30**。

## V2.24 最新進度

V2.24 先把 fixed 職技真正使用時最容易被猜錯的**技能槽／狀態字串／battle command protocol**鎖住，並完整接通兩個 fixed 非戰鬥職技「追尋敵蹤／回避戰鬥」。

- fixed battle command 收的是 **26 格技能槽 index，不是 Skill ID**：server 解析 `P|<slotHex>|<toNoHex>`，再以 `CHAR_getCharSkill(charaindex, slot)` 取得該格 Skill ID。V2.21 保留 slot hole 的決策因此正式和 command protocol 閉環。
- 新增 `sourceProfessionSkillStatusRow/String/Menu()`，逐格鏡像 `SKILL_makeSkillStatusString()` 的 9 欄順序：`USE_FLAG | Skill ID | TARGET | KIND | ICON | COST_MP | LEVEL | NAME | TEXT`。LEVEL 使用 raw/100，MP 使用 V2.20 的 dynamic cost。
- 新增 `sourceProfessionBattleCommandPlan()`：以 slot + raw `toNo` 建立 server parser 相容的 `P|slot|toNo` command，並先跑 V2.20 的職業／MP preflight。
- **不猜 TARGET=1/2/3/5/8/10 的 client UI 語意**：fixed server 只把 TARGET/KIND 傳給 client，battle command 本身接受的是實際 `toNo`。在找到對應 client source 前，V2.24 只保存 metadata，不把數字硬翻成「敵單體／我方全體」。
- fixed `USE_FLAG=0` 的資料只有 Skill 44「追尋敵蹤」與 45「回避戰鬥」；兩者的 callback 都是實際 field skill，因此 V2.24 先做成完整 out-of-battle executor。
- Track/Escape 固定先走 `PROFESSION_SKILL_DEC_COST_MP()`，所以每次先扣 13 MP，再把顯示熟練度整數除以 10，乘 OPTION `倍%5`：例如 Lv10 = ±5%、Lv70 = ±35%。
- 效果固定 **180 秒**，直接作用在原遇敵 CEP：`temp = cep * (100 + p_cep) / 100`，C int 向零截斷。
- 保留 char_walk.c 的來源順序 bug：`temp` 用的是 **min/max clamp 前 CEP**。
- 保留過期那一步的 stale-local bug：timer 過期時 Work 已清 0，但該次 encounter check 仍用剛讀到的舊 `p_cep` 算一次；下一步才真正回 0。
- 保留重複施放怪行為：效果尚未到期時 Track/Escape callback 先設 `ret=-1`，但仍會重新套效果並把 180 秒延長；MP 也已先扣。固定 BATTLESKILL protocol 最後會把這次視為失敗，runtime 以 `protocolWouldReject` 明確標示，不偷偷改成成功。
- Encounter Work 是 fixed transient `CHAR_WORK*`，V2.24 因此放在 runtime global，不寫進 save；reload/login 會自然清除，符合原 server 初始化。

新增 `tools/check_v224_profession_command_outbattle.mjs`。本版沒有新增永久欄位，**save schema 維持 30**。

## V2.23 最新進度

V2.23 把 V2.22 已驗證的熟練度 lifecycle **正式掛回目前 Web 已存在的物理戰鬥事件**。只接 fixed source 與現行 Web 都有一對一事件的位置，不為了「看起來完整」而捏造尚未移植的 battle result。

- **普通回避 live hook**：fixed `BATTLE_DuckCheck()` 的最終 `RAND(1,10000) <= per` 成功後，若 defender 是 Player，立即找第一個 `PROFESSION_AVOID`（Skill 25）並跑熟練度 RNG。
- 這個 hook 同時接進一般 `resolveNormalAttack()` 與 Guardian 前置的 `sourceInitialDodgeOnly()`，避免普通 Enemy attack 與 Guardian 路徑結果不一致。
- **不誤算其他 dodge**：PetSkill/SetDuck 的 `skillDuck` 與裝備 `WDUCKPOWER` 的第二段 suit dodge 都不是 fixed `PROFESSION_AVOID` 升級點，因此不會升回避。
- **Player 會心 live hook**：fixed 會心成功後先完成 `BATTLE_CriDamageCalc/BATTLE_DamageCalc`，接著依來源順序先升 `PROFESSION_WEAPON_FOCUS`、再升 `PROFESSION_DUAL_WEAPON`；Web 現在也在 GuardBreak／GuardAdjust／damage<1 RNG **之前**做同一順序。
- 武器專精仍依 V2.22 的 source marker：斧／棍／槍／弓／回力鏢／投擲斧／投石。沒有學到相符專精時不消耗熟練度 RNG。
- 二刀流仍依 fixed 裝備 gate：`CHAR_ARM` 與 `CHAR_EQSHIELD` 兩格都存在才會繼續查技能與抽熟練度 RNG。
- 同一次 critical 若武器專精與二刀流都已學，兩者按 fixed 順序各自獨立跑熟練度；任一跨 raw 100 邊界都可各自觸發 Profession Level Check。
- live 熟練度跨整百與職業升級現在會寫入戰鬥日誌，狀態本身沿用 V2.21 的永久 `professionSkills/professionLevel/professionSkillPoint`。

本版刻意**沒有**先接：
- `PROFESSION_DEFLECT`：fixed 只在 `BATTLE_ArrangeCheck()` 成功時升，但 Web 尚未實作真正 ARRANGE battle result。
- 火／冰／雷 practice：fixed 在 `analysis_profession_parameter()` 解析職業魔法時升；目前 Web 的職業魔法 damage core 尚未有 live cast 入口。
- 一般 `PROFESSION_SKILL_Use()` post-dispatch：V2.22 規則已完成，但玩家職技 live command UI／dispatcher 尚未接入。

新增 `tools/check_v223_profession_live_physical_hooks.mjs`，鎖定普通 dodge 才升回避、critical 的 Focus→Dual 順序、兩格裝備 gate，以及 hook 在 Guard／damage<1 RNG 前的來源位置。**save schema 維持 30**。

## V2.22 最新進度

V2.22 接上 fixed **職技熟練度成長 + Profession Level Check**。這一版先把所有 RNG 次序與永久狀態變更做成可執行 lifecycle helper；尚未虛構職技 UI，也不先假裝所有 53 個 battle command 都已經能在 Web 完整施放。

- `PROFESSION_NORMAL_SKILL_LEVLE_UP()` 的 RNG 次序正式鎖定：**先抽 `RAND(0,10000)`，再檢查 raw 是否已達 10000**；已滿級時第一顆 RNG 仍然被消耗，但不抽第二顆。
- 未滿級才抽第二顆 `RAND(0, FIX_VALUE*100)`。fixed `_75_TEST` 關閉，所以只有 `rand1 > rawLevel + rand2`（嚴格大於）才讓 raw 熟練度 **+1**。
- fixed `FIX_VALUE` 目前只有 0／10／20／30，因此第二顆 RNG 範圍分別是 0、0～1000、0～2000、0～3000。
- raw +1 後只有在 **新 raw % 100 == 0** 時才呼叫 `PROFESSION_LEVEL_CHECK_UP()`；普通 +1 不會每次都檢查職業等級。
- 職業升級門檻固定為 `oldProfessionLevel * 70 * 100`，把 26 格已學技能 raw 熟練度相加。Skill 63／64／65 即使 raw 不同，來源固定各算 **5000**。
- fixed `PROFESSION_LEVEL_CHECK_UP()` 每次最多只升 **1 級**並增加 **1 點技能點**，即使總熟練度遠高於多個門檻也不會 while 連升。
- 雖然 header 註解寫 `PROFESSION_MAX_LEVEL 26`，但 fixed level-check 執行碼**沒有 26 級 cap 判斷**；Web 不自行修正，因此來源條件足夠時 26 → 27 仍合法。
- `PROFESSION_SKILL_Use()` 的 post-dispatch 經驗順序也已鏡像：若 function 回 `-1`，先吃 `rand()%10`，只有 >5 才直接不給熟練度；其餘情況仍繼續。
- Skill 57「激怒寵物」保留來源特殊 gate：選到的目標不是 Pet 時，不給這次熟練度；這個檢查位於上面的 `ret==-1` RNG 之後。
- 被動／事件型職技已提供來源化 lookup：依 **26 格 slot 順序找第一個 function name 相符技能**；武器專精再依目前武器映射「斧／棍／枪／弓／镖／投／石」，二刀流只有 arm + shield 兩格都存在才進熟練度 roll。

新增 `tools/check_v222_profession_proficiency_runtime.mjs`，鎖住滿級仍吃第一 RNG、第二 RNG 邊界、strict `>`、raw +1、百點邊界、職業熟練度總和、63～65 固定 5000、單次升級、26→27 無硬 cap、post-dispatch `rand()%10`、Skill 57 Pet gate、武器專精與二刀流條件。

這版只修改 V2.21 已存在的永久欄位，**save schema 維持 30**。

## V2.21 最新進度

V2.21 把 V2.20 的 fixed 職業技能資料真正接到**玩家永久職業狀態與 26 格 CHAR_HaveSkill 儲存模型**。本版仍不虛構「轉職按鈕／轉職 NPC」；新角色照原 C 維持無職業，但存檔已能正確保存未來真正取得的職業與職技。

- fixed `CHAR_SKILLMAXHAVE=26`；新增 26 格 `professionSkills`，每格保存原 `skillN` 對應的 `skillId + rawLevel`，空格不壓縮，slot index 會持久化。
- fixed `SKILL_makeStringFromSkillData()` 只保存 `lv` 與 `id`；`SKILL_getInt(SKILL_LEVEL)` 是 raw / 100 的整數除法。Web 同樣把 raw 熟練度原值保存，顯示等級才向零除以 100。
- 新角色來源初值：`PROFESSION_CLASS=0 / PROFESSION_LEVEL=0 / PROFESSION_SKILL_POINT=0`；class enum 為 0 無職／1 勇士／2 巫師／3 獵人。
- `PROFESSION_SKILL_ADDSK()` 已鏡像：level 夾在 1～100、拒絕重複技能、找第一個 unused slot、存入 `displayLevel*100`；26 格滿時失敗。這一層不自行檢查職業、金錢或 prerequisite。
- `NPC_WelfareWindowTalked()` 的學習 preflight 已來源化：非戰鬥 → 已就職 → 職業符合 → 有技能點 → 四組 prerequisite → 金錢 → fixed `_NPC_ProfessionTrans` 轉生條件 → ADDSK。
- prerequisite 的 `percent=0` 保留原特殊語意：同一列多個技能形成 **OR**，至少學會其中一個即可；例如 Skill 50 毒素武器的 30／31／32。
- 一般商店學到的技能初始顯示 Lv10（raw 1000）；原碼對 63／64／65 有 Lv50 特例，但 fixed `_PROSKILL_OPTIMUM` runtime 這三個 ID 是空洞，所以不捏造可購買資料。
- `skill_rate` 仍是 double，乘表內 COST 後存回 int，保留向零截斷；成功 ADDSK 後才扣 Gold，再扣 1 profession skill point。
- 本版沒有把熟練度升級 RNG 接到 live battle；那段 `RAND(0,10000)`＋`RAND(0,fix*100)` 與 profession level-up 會獨立驗收。

因為新增真正永久職業欄位，save schema **29 → 30**。舊 Web 存檔沒有這些欄位，migration 只補來源初值（無職／0 級／0 點／26 空格），不替玩家猜職業。

## V2.20 最新進度

V2.20 把 fixed 職業技能的**資料層與 `PROFESSION_SKILL_Use()` 前半段**正式來源化；仍不猜玩家現在是哪個職業、也不虛構已學技能槽，所以本版先不新增職業技能 UI。

- fixed `gmsv/data/profession.txt` 直接生成 `stoneage_profession_skill_runtime.json`：共 **69 筆**，最大 Skill ID **72**，ID **63／64／65** 保留 `_PROSKILL_OPTIMUM` 下的空洞。
- 三職固定筆數：勇士 20、巫師 21、獵人 28；資料表 **57 種 unique function string** 全部能在 pinned `PROFESSION_SKILL_functbl` 的 **64 個 active dispatch entry** 找到。
- runtime 同時從 pinned `profession_skill.c` 自動掃出真正呼叫 `profession_common_fun()` 的 function → `BATTLE_COM_*` 對應，不用手抄技能名稱猜 command。
- `PROFESSION_MAGIC_COST_MP()` 的固定動態 MP 表已接入，包含 `_PROFESSION_ADDSKILL` 分支與原本不可達的 CURRENT `>9` 分支順序；不在該表的技能才退回 `profession.txt COST_MP`。
- `PROFESSION_BOUNDARY` 保留 `OPTION` 含 `破结界` 時的另一組 MP 門檻。
- `PROFESSION_SKILL_DEC_COST_MP()` 已鏡像成 preflight：先檢查 raw skill level，再算 MP；MP 不足失敗；除 Skill ID 11 嗜血成性外，`dec_mp<=0` 也失敗。嗜血成性可合法 0 MP。
- `PROFESSION_SKILL_Use()` 的來源順序已鎖：`_PROSKILL_OPTIMUM` 職業一致性 → function 存在 → Player → MP 扣除 → function dispatch。結果明確回報 `deductBeforeDispatch=true`；後續 function 若失敗，原 C 不會退 MP。
- **不新增假的 gate**：`PROFESSION_SKILL_Use()` 本身不檢查 `USE_FLAG` 或 `TARGET`，所以 runtime 只保存這兩欄供上層 UI／協定使用，不拿它們阻擋 preflight。
- `profession_common_fun()` plan 保存 raw 1～100 skill level 到 COM3 high、Skill ID 到 COM3 low。世界末日／火龍槍還保留 `_PROFESSION_ADDSKILL` 的蓄力行為：先把 COM1 改回 `BATTLE_COM_NONE`，另存 deferred command，`DOOMTIME` 分別為 3／2。

新增 `tools/generate_profession_skill_runtime.py`、`data/generated/stoneage_profession_skill_runtime.json` 與 `tools/check_v220_profession_skill_runtime.mjs`；runtime 已加入開機驗證與 CI generated-runtime closure。玩家職業／已學職技尚未進 save，因此 save schema 維持 **29**。
## V2.19 最新進度

V2.19 開始移植 fixed **職業魔法傷害數值核心**，先把 V2.17／V2.18 已保存、但先前刻意沒有錯接的裝備／套裝 Work 接到它們真正的來源 consumer。這一版**不先造假的職業技能選單或技能資料**；先完成 `PROFESSION_MAGIC_GET_PRACTICE() → UN_POW_M → PROFESSION_MAGIC_GET_DAMAGE()` 可執行核心，之後接真正職業技能入口時可直接沿用。

固定 build 已確認 `_PROFESSION_SKILL / _PROFESSION_ADDSKILL / _FIX_MAGIC_RESIST / _EQUIT_RESIST / _MAGICSTAUTS_RESIST / _SUIT_ADDENDUM / _SUIT_ADDPART4` 都開啟，因此本版只走 fixed 真正會編進去的分支：

- `PROFESSION_CHANGE_SKILL_LEVEL_M()` 的原 1～10 分段已來源化；例如 raw 90→9、91→10。
- `analysis_profession_parameter()` 的固定字串順序是 **火／冰／电 → magic type 1／2／3**。Web 保留這個 literal 與順序，不自行把簡體 `电` 改成另一個資料值。
- `PROFESSION_MAGIC_GET_PRACTICE()` 每次**先固定吃 1 顆 `RAND(1,100)`**，即使該技能分支根本不用 critical；開啟 `_SUIT_ADDPART4` 後又固定吃 1 顆 `rand()%100` 判斷 `M2_POW`，只有最終 `hp_power>0` 才再吃 `RAND(98,102)`。
- `M_POW` 先無條件調整 `hp_power`；`M2_POW` 僅在第二顆 RNG `<30` 時調整。`hp_power` 是 C `float`，Web 以 `Math.fround()` 保留每次存回 float 的精度，再在 `PROFESSION_MAGIC_ATTAIC()` 等價位置轉成 int `power`。
- `UN_POW_M` 位於特殊魔法 power 修正之後、`PROFESSION_MAGIC_GET_DAMAGE()` 之前；原 `power -= power * pct / 100.00` 存回 int 的向零截斷已保留。
- `_FIX_MAGIC_RESIST` 傷害式已來源化：熟練度、角色抗性、套裝／裝備抗性、精靈抗性依原順序相乘，負傷害最後 clamp 0。
- 世界末日 `BATTLE_COM_S_DOOM` 不是最後一次才截斷；原 `int damage` 會在火段賦值、雷段 `+=`、冰段 `+=`、最後 `/=3.0` **每一步都再向零截斷**，Web 同樣逐段保存。
- 保留 fixed 的欄位錯位：magic type 2 實際讀 **雷熟練／雷抗 + 冰 base suit + 雷裝備抗**；type 3 實際讀 **冰熟練／冰抗 + 雷 base suit + 冰裝備抗**。這和上面的「冰→2、电→3」組合看起來不直觀，但不自行修正來源 bug。
- V2.17 的 `CHAR_WORKEQUITFIRE / THUNDER / ICE` 與 V2.18 的 `M_POW / M2_POW / UN_POW_M` 現在都有正式 profession-magic consumer helper；仍**不混入 V2.16 的 `BATTLE_MultiAttMagic`**，避免把兩套不同魔法公式合併。

新增 `tools/check_v219_profession_magic_damage_core.mjs`，鎖住 skill-level 分段、literal magic type、RNG 次序、CURRENT 的來源邊界、float→int 截斷、UN_POW_M、type 2／3 錯位與 DOOM 分段 int truncation。

另外修正既有 field2 generator 的非語意漂移：`FIELD2_KEYS` 原本是 Python set，導致相同 pinned source 在不同 Actions process 可能只因 JSON key 順序不同就產生 bot commit；現在改為固定 tuple 順序。這**不改任何 field2 規則或數值**，只讓 generated runtime 可重現。沒有新增永久狀態，save schema 維持 **29**。
## V2.18 最新進度

V2.18 完成第六組、也是目前 fixed item table 剩餘的玩家裝備 callback：`ITEM_suitEquip / ITEM_ResuitEquip` 套裝系統。

fixed `itemset6.txt` 共驗到 **236 件**這組 callback、**51 個 SUITCODE**。原 `ITEM_CheckSuitEquip()` 的核心規則已來源化：

- 每次穿／脫裝都重新掃 9 個裝備格。
- 同一 `ITEM_SUITCODE` 至少 **3 件**才啟用；依裝備格 0→8 掃描，**第一個達到 3 件的套裝碼勝出**，不是同時啟用多套。
- 啟用後再依 0→8 掃一次同套裝碼成員，解析各件 `ITEM_ARGUMENT`。原函式是 `CHAR_setWorkInt`，所以同一 Work **後面的裝備格覆寫前面的值，不累加**。
- `NPC_Util_GetStrFromStrWithDelim()` 是先以 `strstr()` 找到含 key 的 pipe token，再取第二個 `:` 欄位 `atoi`；Web 保留這個來源語意。
- item-make runtime 的 byte-preserving `g` 現在除了 callback item，也會替所有 `SUITCODE > 0` 的 item 保存 argument，因為原第二次套裝掃描不要求每件成員本身有 callback。

這份 fixed 資料真正出現的套裝 Work 只有 16 種：`FSTR / MSTR / MTGH / MDEX / HP / MP / RESIST / COUNTER / M_POW / WAST / WDUCKPOWER / RENOCASE / SUITDEXP / SUITPOISON / M2_POW / UN_POW_M`。目前已接入所有在現行 Web 核心中有完整原 C 消費鏈的部分：

- 能力值：`FSTR / MSTR / MTGH / MDEX / SUITDEXP`，以及原函式已支援的 `VIT / SUITSTRP / SUITTGH_P`，按 `Other_DefcharWorkInt()` 的 int／float 截斷順序套用。
- `HP / MP`：不是整輪結束才補，而是在玩家每次輪到 `BATTLE_StatusSeq()` 時依套裝 Work 回復，並照原 max/min 規則 clamp。fixed `_TYPE_TOXICATION` 會另外查 connection-level toxication；Web 尚無該 connection 系統，因此不把普通戰鬥中毒錯當成這個 gate。
- `RESIST`：扣在一般 `BATTLE_StatusAttackCheck()`；原 paralysis 快速分支不吃這個套裝 RESIST。
- `RENOCASE`：保留來源 bug。雖然註解是抗沉默，但 fixed code 實際只在 **WEAKEN／虛弱** 時再扣一次。
- `COUNTER`：玩家反擊率在武器倍率＋Luck 後直接再加此 Work。
- `WDUCKPOWER`：普通 `BATTLE_DuckCheck` 完成後再獨立抽一顆 `rand()%100`，嚴格 `roll < power` 才閃避；COMBO 明確跳過這第二段閃避。
- `SUITPOISON`：普通玩家物理攻擊在沒有其他預選 `gBattleStausChange` 時才接管為 poison，固定 turn=3，Work 值作 StatusAttackCheck 的 PerOffset。BREAKTHROW 會先預選 paralysis，因此投石麻痺優先，**不額外抽套裝毒 RNG**；反擊走 `BATTLE_Counter()->BATTLE_AttackSeq()`，也不進套裝毒段。

暫不錯接的 fixed Work：

- `WAST`：原消費點是 water-world／connection 呼吸狀態，現行 Web 尚無這條連線環境系統。
- `M_POW / M2_POW / UN_POW_M`：原消費點在 `PROFESSION_MAGIC_GET_DAMAGE()` 職業魔法鏈，現行 Web 尚未移植，因此只保留正確套裝 Work，不嫁接到別的魔法公式。

新增／強化 `tools/check_v218_suit_equip_callback.mjs`，完整鎖住 236 件、51 個套裝碼、啟用／覆寫規則、能力 compliance、異常抗性、反擊、第二段閃避、StatusSeq HP/MP、套裝毒與 BREAKTHROW 優先序。save schema 維持 **29**。

## V2.17 最新進度

V2.17 完成第五組玩家裝備 callback：`ITEM_MagicResist / ITEM_MagicReResist`，並補掉 V2.16 的 lazy field2 argument 漏洞。

這次不硬寫舊編碼中文字。pinned `recode.sh` blob `10ef38a0e84b70e8573d94199d038416afadf923` 明確記錄 `gmsv` 曾以 `recode gb18030..utf8` 轉碼；generator 因此從 pinned `item_event.c` blob `00e05ebe58ef3988f7e0121f2a3aa5ede78344b5` 讀取目前 UTF-8 的七個 `strstr()` literal，再依來源證據還原成 GB18030 執行字串 bytes，並強制驗證每個 marker 都正好是原 C `p+4` 對應的 4 bytes。fixed `ITEM_ARGUMENT` 則以 latin1 byte-preserving 形式放進較小的 item-make runtime。這樣不需要預先載入 10,737 筆大型 field2 runtime，也不猜字元集。

原 C lifecycle 已接入：

- 登入：`CHAR_loginCheckUserItem()` 依裝備格 0→8 重播 attach callback；Web 的 transient Work 也依同一順序重建。
- 穿裝：`ITEM_MagicResist()` 是 `CHAR_setWorkInt`，只把第一個命中的類別**直接設值**，不是累加。fixed 有效列已驗到：2898=虛弱30、2899=魔障30、2900=沉默30、2901=落馬30、20643=沉默15。若 fixed row 的 argument 沒有七個 marker，原 callback 就是合法 no-op，Web 也照樣允許裝備而不猜效果；目前驗到的 no-op Item 為 2907、2912、2917、2922、21032、21037、21174、21400。
- 換裝：原 `CHAR_moveItemFromItemBoxToEquip()` 先交換格子，再舊裝 detach、最後新裝 attach；Web 保留相同事件順序。
- 卸裝：保留 fixed source 的明確 bug——`ITEM_MagicReResist()` 七個分支最後全部都只做 `CHAR_WORKEQUITFIRE = 0`。因此卸掉雷／冰／虛弱／魔障／沉默／落馬裝備時，對應 Work 可能暫時殘留到重新登入或被另一個 attach 覆寫。
- 虛弱／魔障／沉默：已接到 `BATTLE_StatusAttackCheck()` 的命中率扣減。
- 落馬：已接到 `RAND(0,100) > 50 + CHAR_WORKEQUITFALLRIDE`。
- 火／雷／冰：Work 值與 lifecycle 已完整保留；fixed C 的消費點是 `PROFESSION_MAGIC_GET_DAMAGE()` 的 suit 抗性。現行 Web 尚未有這條職業魔法傷害路徑，因此本版**不把它誤接到 V2.16 的 BATTLE_MultiAttMagic 魔防公式**。

V2.16 同步修正：20184／20420／20421 的 EA/WA/FI/WI/QU 原始 argument 現在直接取自小型 item-make runtime；即使玩家本次頁面從未使用 field=2 技能、`itemField2Db` 尚未 lazy-load，魔防裝效果仍會正常生效。existing item 若被 V2.05 改寫 `field2Char.argument`，仍以 live override 優先。

新增 `tools/check_v217_equip_resist_callback.mjs`，並強化 V2.16 regression。這些 Work 都是登入重建的 transient 狀態，不新增永久存檔欄位；save schema 維持 **29**。

## V2.16 最新進度

V2.16 完成第四組裝備 callback：`ITEM_MagicEquitWear / ITEM_MagicEquitReWear`。fixed itemset6 只有三件：

- Item 20184 亞伊歐之鎧：`EA:40|WA:40|FI:40|WI:40|QU:40`
- Item 20420 雷爾鎧1：`EA:10|WA:10|FI:10|WI:10|QU:10`
- Item 20421 雷爾服1：`EA:10|WA:10|FI:10|WI:10|QU:10`

原 `item_event.c + battle_magic.c` 行為已接入：

- `EA/WA/FI/WI` 分別加到玩家地／水／火／風 `def_magic_resist[]`
- 這個加值發生在 `_MAGIC_DEFMAGICATT` 百分比魔抗狀態之前，因此魔抗狀態會放大「基礎魔抗 + 裝備魔抗」的正值總和
- 裝備魔抗允許 -100～100；若合計變成負值，原公式會保留負值，不強制 clamp
- `QU` 不加入四屬傷害魔抗，而是在 `BATTLE_MagicDodge()` 以 `QU × 0.9` 加到玩家魔法閃避門檻
- Pet／Enemy 不吃玩家裝備魔抗

Web 從目前 equipped existing item 的 **當前 callback + argument** 即時重建效果，因此若 V2.05 鑲嵌把 callback／argument 改掉，效果會跟著消失，不新增 save/Work 欄位。三件本身都沒有 field2 `typeCode`，不能合法充當 572 鑲嵌材料，所以這組 callback 不會被來源流程複製到其他 Item ID。

新增 `tools/check_v216_magic_defense_equip_callback.mjs`。save schema 維持 **29**。

## V2.15 最新進度

V2.15 完成第三組裝備 callback：`ITEM_randEnemyEquip / ITEM_RerandEnemyEquip`。fixed `itemset6.txt` 中只有三件月亮首飾：

- Item 20126：`rand:60`
- Item 20127：`rand:70`
- Item 20128：`rand:100`

原 `_Item_MoonAct + char_walk.c` RNG 順序已接入：

1. 先照原本規則抽 `rand()%120 < CEP`。
2. 第一抽沒命中：照舊 `CEP + 1`，**不抽月亮首飾 RNG**。
3. 第一抽命中且有月亮首飾：再抽一次 `RAND(0,100)`。
4. 只有 `Rnum > rand` 才真的進 encounter；若 `Rnum <= rand`，此次遇敵被擋掉。
5. 被擋掉時 CEP 維持當步原值，不歸 min、也不 +1。
6. 真正進戰鬥才把 CEP 重設為 min。
7. `rand:100` 因 `RAND(0,100)` 不可能大於 100，所以會擋掉所有一般隨機 encounter。

月亮首飾只作用於一般 walking random encounter；V2.14 太陽神 NoEnemy 仍更早跳過整段 encounter RNG，任務 `questZone`／NPC 腳本戰仍不受影響。

Web 從目前 equip slots 即時推導 rand threshold，不新增存檔欄位。未知同名 callback 物品仍 fail-closed。新增 `tools/check_v215_randenemy_equip_callback.mjs`。

save schema 維持 **29**。

## V2.14 最新進度

V2.14 完成第二組裝備 callback：`ITEM_equipNoenemy / ITEM_remNoenemy`，固定 item table 中只有三件太陽神首飾：

- Item 18546：`ITEM_ARGUMENT noen:40`
- Item 18547：`ITEM_ARGUMENT noen:80`
- Item 18548：`ITEM_ARGUMENT noen:120`

原 `item_event.c + char_walk.c` 規則已接入：

- `noen >= 120`：只在 Floor 100／200／300／400／500 不遇隨機敵
- `noen >= 80`：只在 Floor 100／200／300／400
- `noen >= 40`：只在 Floor 100／200
- 原函式也保留 `>=200` 全 Floor 分支，但目前 fixed itemset6 這組 callback 沒有 200 級物品
- 生效時仍算一次成功走路，但**不執行 `rand()%120`、不修改 CEP、不進入一般 encounter**
- 任務 `questZone`／NPC 腳本戰不受影響，因原效果只包在 `char_walk.c` 的隨機遇敵段

Web 不保存新的 eqnoenemy 欄位，而是從目前已裝備 existing item 即時推導，等價登入後依裝備恢復 Work/connection 效果。未知 `ITEM_equipNoenemy` 物品沒有 sourced `noen` 時仍 fail-closed，不猜參數。

新增 `tools/check_v214_noenemy_equip_callback.mjs`。save schema 維持 **29**。

## V2.13 最新進度

V2.13 完成第一組裝備 callback：`ITEM_WearEquip / ITEM_ReWearEquip`。固定 item table 中只有 **Item 1975、20130** 使用這組 callback，兩件都是 `ITEM_TYPE=11` 戒指、無 profession 限制。

原 C 行為：

- `ITEM_WearEquip()`：`CHAR_PickAllPet = TRUE`
- `ITEM_ReWearEquip()`：`CHAR_PickAllPet = FALSE`
- `BATTLE_CaptureCheck()`：只有在 `CHAR_PickAllPet != TRUE` 時才套用「敵寵等級不得高於玩家等級 +5」；旗標 TRUE 直接跳過這條等級限制。
- 捕獲率後面的 HP／等級／DEX／Luck／Charm 計算完全不變。

Web 現在允許這一組 callback 通過裝備 gate；`sourcePlayerPickAllPetEnabled()` 從目前 9 格已裝備 existing item 推導 Work flag，所以裝上／卸下、重新讀檔都與目前裝備狀態一致，**不新增永久存檔欄位**。捕獲判定改由 `sourcePlayerCaptureLevelAllowed()` 套用 fixed `CHAR_PickAllPet` 規則。

其餘 5 組 callback 仍維持 `callback-unported` fail-closed，不擴大猜測。

新增 `tools/check_v213_pickallpet_equip_callback.mjs`。save schema 維持 **29**。

## V2.12 最新進度

V2.12 收斂玩家裝備 adapter 的 **使者／勇者信物特殊邊界**，只修 fixed C 能完整證明的部分。

- fixed build 開啟 `_ANGEL_SUMMON`。
- `ANGELITEM=2884`、`HEROITEM=2885`。
- `CHAR_moveItemFromItemBoxToEquip()` 的 MissionTable／所有權檢查 **只套用 Item 2884**。
- 2884 固定 item table 是 `ITEM_TYPE=10`，無 profession／attach／detach callback；Web 尚無多人 MissionTable，因此仍維持 `special-equip-unported`。
- 2885 固定 item table 是 `ITEM_TYPE=16 (ITEM_OTHER)`，同樣無 profession／attach／detach callback；原 C `ITEM_getEquipPlace()` 對 type 16 本來就回 `-1`，所以不是可裝備品，也不該被歸進 2884 的特殊任務 gate。

因此 `SOURCE_PLAYER_SPECIAL_EQUIP_IDS` 從 `[2884,2885]` 修正為只含 `[2884]`。新增 `tools/check_v212_special_equip_boundary.mjs`，直接執行 production `sourcePlayerEquipRequirements()` 與 `sourcePlayerEquipPlace()` 驗證分流。

save schema 維持 **29**。

## V2.11 最新進度

V2.11 不再擴張合成規則，而是先把 V2.10 的 live lifecycle 鎖成**可執行 fixture regression**。測試會直接從 `game.js` 抽出目前 production 的 `sourceMergeLifecyclePreflight()`、`sourceConsumeTrackedExistingItem()`、`sourceMergeCooldownState()`、`sourceMergeExecuteLifecycle()`，放進 Node `vm` 執行，不只做字串搜尋。

固定 fixture：

- **滿背包 preflight**：15 個背包格全滿時，直接 `merge-backpack-full`，不進材料模板／RNG。
- **pile > 1**：消耗 1 pile，只把 `ITEM_USEPILENUMS` 減 1，existing 與 aggregate inventory 都保留。
- **pile == 1**：消耗後 free existing、清 CHAR 背包 slot，aggregate inventory 才減少。
- **正常成功**：merge count +1 → 材料消耗 → 成品 existing → `ITEM_MERGEFLG=1` → 加入第一個空背包格。
- **cooldown fallback**：確認 `5+(num-2)` 命中後 timestamp 先更新，core 收到 `cooldownHit=true`，仍走材料消耗與成品生命週期。
- **mixed dish -10**：不產生成品，但 merge count 仍 +1、有效材料仍各扣 1 pile。
- **成品加入失敗**：已建立的成品 existing 會依原 C free；材料與 merge count 不回滾。

新增 `tools/check_v211_merge_live_fixtures.mjs`，並加入 GitHub Actions。save schema 維持 **29**。

## V2.10 最新進度

V2.10 正式把 200／201 `PETSKILL_Merge` 從 pending gate 接成可玩的原 C lifecycle；RNG 與物品 mutation 現在一次完整執行，不再存在「只吃 RNG、不刪材料／不產生成品」的半套狀態。

固定順序：

1. `CHAR_findEmptyItemBox` 等價檢查先執行；背包 15 格全滿時直接拒絕，**0 RNG、0 材料 mutation**。
2. 每個有效 `CANMERGEFROM==1` input 先各跑 `ITEM_makeItem`，仍是 66 顆 RAND／件。
3. 有效材料 >1 後，以 `time(NULL)` 秒級 timestamp 鏡像 `CHAR_WORKLASTMERGETIME`：門檻是 `5+(num-2)` 秒；命中 cooldown 會更新 timestamp，再吃 `RAND(0,num-1)` 回傳某個 input ITEM_ID。
4. 正常路徑接 V2.09 atom／retry executor；`-10` mixed dish 與 `-1` no-atom 都視為原 C 真實負結果。
5. 只要已進 `ITEM_mergeItem()`，原 C 都先把本次有效材料各扣 1 `ITEM_USEPILENUMS`；扣到 0 才解除背包 slot 並 `ITEM_endExistItemsOne`。
6. `ret>=0` 才 `ITEM_makeItemAndRegist(ret)`；這一步會再跑成品自己的 66-field `ITEM_makeItem` RNG。
7. 成品 existing 先設 `ITEM_MERGEFLG=TRUE`，再 `CHAR_addItemSpecificItemIndex` 加入背包。
8. 若加入背包失敗，依原 C 立刻銷毀新成品 existing；已消耗的材料與 RNG 不回滾。
9. `CHAR_MERGEITEMCOUNT` 也在每次有效材料 >1 的嘗試後累加；Web 以 `mergeItemCount` 保存。
10. `CHAR_WORKLASTMERGETIME` 是 Work 值，因此 Web 只保留在目前頁面執行期，不寫入存檔；save schema 維持 **29**。

新增 `sourceMergeCooldownState()`、`sourceMergeLifecyclePreflight()`、`sourceMergeExecuteLifecycle()` 與 `tools/check_v210_merge_live_lifecycle.mjs`。

## V2.09 最新進度

V2.09 把 200／201 的 fixed-C RNG **執行核心**串完整，但為避免「吃 RNG 卻不產生成品」的半套狀態，玩家按鈕仍不呼叫 executor；下一版和材料刪除／成品建立一起原子化啟用。

已固定執行順序：

1. 依背包 slot 升冪掃選取物品。
2. 只有 `CANMERGEFROM==1` 的物品先各跑一次 `ITEM_makeItem()`。
3. 每件 `ITEM_makeItem()` 固定消耗 **66 顆 RAND**，包含 width=0 的欄位。
4. 若有效材料不足 2 件，到此結束；已發生的 66×N RNG 不回滾。
5. 原 C 5+(num-2) 秒 cooldown 位於這些 66×N RNG **之後**；cooldown 命中時再吃一顆 `RAND(0,num-1)`，直接回傳其中一件 input ITEM_ID。
6. 正常路徑才做 mixed-dish、atom simplify 與每 atom 的 `ITEM_randRange()`。
7. `ITEM_randRange()` 只有真正 range>0 時才吃一顆 RAND；rate=0、range=0 等原 C early return 不吃 RNG。
8. 然後第一次 candidate scan 取得 hitnum。
9. 每次 `ITEM_merge_with_retry()` 先吃 `RAND(0,999)`，**再**檢查 `extractcnt>=ideal`；完全失敗時所以會多一顆 terminal RAND。
10. 命中 candidate 後再吃一顆 `random()%match`。
11. 一個 `ITEM_mergeItem()` 最多呼叫 5 次 retry；五次全敗後再吃一顆 `RAND(0,num-1)`，回傳一個 input ITEM_ID。

GNU libc 的 `rand()` 與 `random()` 共用同一個 `__random()` 狀態，因此 V2.09 也維持 Web 既有的單一 RNG stream lifecycle；Web 並不宣稱複製 glibc 的 bit-for-bit PRNG，只鎖原 C 的呼叫順序與分支消耗。

新增：

- `sourceMergeMakeInputClones()`
- `sourceMergeCollectCloneAtoms()`
- `sourceMergePrepareClones()`
- `sourceMergeExecuteRandRangePlan()`
- `sourceMergeExecuteRetryOnce()`
- `sourceMergeExecuteRetryOuter()`
- `sourceMergeExecuteCoreRng()`
- `tools/check_v209_merge_rng_lifecycle.mjs`

代表 regression：

- ideal=3 立即命中：1 顆 retry RAND + 1 顆 modulo RNG
- ideal=3 完整失敗一次：3 個 unique class + 1 顆 terminal extra RAND = 4 顆
- duplicate class 仍吃 RNG，不增加 extractcnt
- ideal=3 五次 retry 全敗 + input fallback：**21 顆** retry/fallback RAND

目前 live 200/201 回傳 `mergeRngLifecycleReady=true`，但仍保持按鈕端 **0 RNG consumption**，等下一批 lifecycle 原子化。

save schema 維持 **29**。

## V2.08 最新進度

V2.08 延續 200／201 `PETSKILL_Merge`，完成 `ITEM_merge_with_retry()` 的**候選 cache 與 retry 規則前置**，仍不實際擲 RNG。

固定來源結果：

- pinned build `_IMPOROVE_ITEMTABLE` 關閉，因此 `icache[i]` 的 `i` 就是 `ITEM_ID`
- itemset6 共 5808 個 `CANMERGETO`
- 其中 5804 個具有至少 1 個可解析 ingredient，成為真正 candidate
- candidate ingredient 數量分布：
  - 1 種：11
  - 2 種：270
  - 3 種：1278
  - 4 種：2892
  - 5 種：1353
- 31518 個 ingredient entry 全部可對到固定 112 atom，unknown = 0
- fixed `MAXMATCH=2048`

`ITEM_merge_with_retry()` 第一個新的 RNG 是 `RAND(0,999)`，依 unique atom 數（最多 5）決定這次要求 candidate 必須有幾種 ingredient。V2.08 已鎖定原表：

- ideal 1：1種 100%
- ideal 2：1種 25%、2種 75%
- ideal 3：1種 15%、2種 25%、3種 60%
- ideal 4：1種 7%、2種 19%、3種 44%、4種 30%
- ideal 5：1種 4%、2種 16%、3種 30%、4種 24%、5種 26%

同一 `ITEM_merge_with_retry()` 呼叫裡，第一次 class 才掃全部 icache 並寫 `hitnum`；後續抽到不同 class 只重用第一次的 hitnum。若抽到已試過的 class，仍會消耗 RNG 後直接 continue。

候選 range matching 也已來源化成 pure plan：

- 加工：依 `ItemRandTableForItem[table].rate` 比上下限，普通寵上限額外 cap 1000
- 料理：`ItemSearchTable[1] = 0.7～1.3`
- 普通寵料理會把過高的 `ingtable[k]` **原地改成 814**（`1059 / 1.3` 的 C int 截斷），這個 mutation 已保留
- candidate 必須 `hitnum == inguse == extractnum`
- 輸入材料本身的 ITEM_ID 不可成為結果
- 命中結果最後由原 C `random() % match` 再選一個

代表 regression：

- atom 皮/骨/線，各 305 → extract 3 唯一命中 candidate **2106**
- 料理 atom 26、值 900 → 先原地 clamp 814，extract 1 唯一命中 **2506**

目前 action 只建立 candidate cache + retry spec，保持 `sourceNoRngConsumed=true`。下一步才會把前面的 `ITEM_makeItem` 66×N RNG、atom `ITEM_randRange` RNG、retry `RAND(0,999)` 與 `random()%match` 串成真正原 C RNG lifecycle。

save schema 維持 **29**。

## V2.07 最新進度

V2.07 延續 200／201 `PETSKILL_Merge`，只完成下一小塊固定數值鏈：

`ITEM_simplify_atoms() → ITEM_getTableNum() → ITEM_randRange() plan`

這一版仍 **不實際消耗 RNG、不產生成品、不刪材料**；只把可以完全由原 C 證明的「材料整理＋隨機範圍計畫」算出來。

已固定：

- `itematom.txt` 跨檔名稱比對改用 latin1 1:1 source-byte key，與 V2.04 `ITEM_INGNAME` runtime 相同
- `ItemRandTableForItem` 20 級：0～24、25～54……最後 3692～4000
- `ITEM_GEN_RATE=0.7`
- `oddstable = 0.1, 0.25, 0.35, ... 0.53`
- 同素材先升冪排序，再以前一筆「已被修正後的 double 值」逐級疊加
- 最終依 C cast 截成 int；普通出戰寵上限 1000
- 超過 15 筆同 atom 會碰到原 C oddstable 邊界，因此 Web 直接 no-guess，不讀陣列外
- `ITEM_randRange` 的 min/max rate、C `rint`（ties-to-even）、range=0 時回 base 的怪行為已轉成 plan
- 加工／料理仍由第一個可合成物品的 `ITEM_TYPE==20` 決定 searchtable，不拿技能 ID 200/201 猜
- 非 `CANMERGEFROM` 物品依原 C 跳過；料理與非料理混用依原 C `-10` 規則拒絕
- item ingredient 找不到 atom 時，依原 ADD_INGRED 巨集直接跳到下一件物品，該物品後續 ingredient 不處理

V2.07 action 目前會回報 static prepare 結果與「預計 atom RNG 次數」，但保持 `sourceNoRngConsumed=true`。下一缺口仍是 `ITEM_merge_with_retry()` 的成品候選搜尋與後續完整 lifecycle。

save schema 維持 **29**。

## V2.06 最新進度

V2.06 先以小批次完成 200／201 `PETSKILL_Merge` 的 **enemybase 寵物加工修正來源層**；成品抽選與完整 lifecycle 尚未接完，所以仍維持「不猜合成結果」。

### V2.06 enemybase / itematom Pet merge-fix runtime

新增 pinned runtime：

- `enemybase1.txt`：1816 列、1813 個唯一 TempNo
- 980 個 TempNo 有 ATOM 加工修正
- 4602 個非空 ATOMFIX slot
- 4572 個可在 `itematom.txt` 精確解析；30 個固定來源本身無對應 atom
- `itematom.txt`：112 個唯一素材名稱
- 固定 `_MERGE_NEW_8` 關閉，因此 `ITEM_RANDRANGEDOM_BASE=0`
- 2 組 min/max 依原 C 在成功解析 atom 後交換
- 原 `ITEM_merge_getPetFix()` 外層 5 次迴圈會把 5 個 slot 重跑 5 次；有效資料實際展開 22860 筆
- 找不到 atom 時原巨集的 `continue` 會直接進下一個外層 pass，因此後續 slot 被跳過；固定資料共發生 75 次 pass abort
- runtime 維持 lazy-load，不加入開機 Promise.all
- 玩家 Pet 已有的 source `petId`（fixed `CHAR_PETID = E_T_TEMPNO`）直接作 TempNo lookup，不拿 Web id 猜

新增：

- `tools/generate_pet_merge_fix_runtime.py`
- `data/generated/stoneage_pet_merge_fix_runtime.json`
- `tools/check_v206_pet_merge_fix_runtime.mjs`

200 加工／201 料理現在會先載入並解析出戰寵的固定 ATOM 修正；但 `ITEM_mergeItem_merge` 的完整 merge table/runtime 與成品 lifecycle 尚未完全來源化，因此仍回傳 pending，不先造合成結果。

save schema 維持 **29**。

## V2.05 最新進度

V2.04～V2.05 已正式進入 **field=2 寵物生活技能**。

### V2.04 固定 item field=2 runtime

新增 pinned `itemset6.txt` 字串 runtime：

- 固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `itemset6.txt` **10737 / 10737** 筆模板解析成功
- syntax error 0、duplicate ID 0
- 296 筆模板有 `TYPECODE`
- 9437 筆模板有修復材料 `INGNAME0～4`
- 1759 個 nonblank item function string
- 保留 `TYPECODE / INLAYCODE / ARGUMENT / SECRETNAME / INGNAME0～4` 與完整 function strings
- legacy 字串採 latin1 byte-preserving，只做原 C exact equality / ASCII token 判斷，不把亂碼當顯示文字猜譯
- 約 1.9 MB runtime **只在真的使用 field=2 技能時懶載入**，不增加每次開遊戲的手機負擔

### V2.05 540 修復 / 572 鑲寶石

玩家目前可從現有 15 格 source-backed 背包選材料，並由出戰寵實際擁有的 field=2 PetSkill 執行：

- **540 修復 / `PETSKILL_Fixitem`**
  - 最多選 2 個物品
  - 料理不可修復
  - 必須恰好一件武器／防具（ITEM_TYPE 0～15、17～19）
  - 材料 `INGNAME0` 必須精確匹配目標 `INGNAME0～4`，或材料 `ARGUMENT=FIXITEMALL`
  - 耐久必須低於 Max × 80%
  - Max 耐久 <500 不可再修
  - 成功後新 Max = `trunc(oldMax × 0.85)`，目前耐久直接補至新 Max，`CRUSHLEVEL=0`
  - 材料依固定 `CHAR_DelItem(...,1)`：堆疊 >1 只扣 `ITEM_USEPILENUMS` 一個，剩 0 才 free existing item

- **572 鑲寶石 / `PETSKILL_Inslay`**
  - 最多選 4 個物品
  - 每個物品都必須有 nonempty、非 `NULL` TYPECODE
  - 恰好一件 TYPECODE 含 `INSLAY` 的基底裝備
  - 固定資料實際有 **200 個 INSLAY 基底模板**
  - INLAYCODE 固定三格，填第一個 `NULL`
  - 精確相加 8 欄：攻／防／敏／HP／MP／運／額外傷害／額外防禦
  - 材料 MAGICID >0 時覆蓋 MAGICID / MAGICUSEMP
  - 材料的 init / preOver / postOver / watch / use / attach / detach / drop / pickup / **relife** 10 個 function string 與 ARGUMENT 全部覆蓋到目標
  - 多材料逐個提交；後一顆失敗不回滾前面已成功的原 C 變更
  - 鑲入 `ITEM_DIErelife` 後，目標裝備死亡時會真正進現有死亡復活 lifecycle，不只是保存字串

固定資料另確認只有 **1 個 FIXITEMALL** 萬用修復材料模板。

200 加工／201 料理雖已顯示為 field=2 技能，但目前 `ITEM_mergeItem_merge` 的完整 merge table/runtime 尚未來源化，因此仍明確 **不猜合成結果**。

新增：

- `tools/generate_item_field2_runtime.py`
- `data/generated/stoneage_item_field2_runtime.json`
- `tools/check_v204_item_field2_runtime.mjs`
- `tools/check_v205_player_field2_fixitem_inslay.mjs`

V1.72～V2.06 regression 已接入同一條 CI；`game.js` syntax check 維持。

V2.03 field=0/1 coverage closure 與 V2.02 Combined lifecycle 全部保留。

save schema 維持 **29**。

## 目前主要系統

- PC／手機共用網頁遊戲
- 166 組一般野外 Lv1 捕獲基準
- Encounter → Group → Enemy → RandomEnemy → RandomChange 原版生成鏈
- Enemy 掉落與 existing-item lifecycle
- 玩家／寵物／Enemy 戰鬥核心
- 大量 PetSkill 與原 C RNG lifecycle
- Player 9 裝備格 + 15 existing-item 背包格
- ITEM_makeItem / ITEM_equipEffect source-backed runtime
- 玩家裝備需求、四屬性、異常抗性、會心、命中、忽防、額外傷防
- Player / Pet death、Ultimate、裝備死亡復活、GMQUE trophy lifecycle

## 重要檔案

- `game.html`：遊戲入口
- `game.js`：主要遊戲與原 C 對齊邏輯
- `game.css`：PC／手機共用介面
- `data/generated/stoneage_item_make_runtime.json`：固定 Item template runtime
- `tools/`：資料生成與 regression 工具

## 完整開發紀錄

原 README 已超過 GitHub 首頁 README 的顯示上限，因此從 V1.74 起改為「精簡首頁 + 歷史分檔」。

**舊內容沒有刪除。**

➡️ [查看完整 CHANGELOG / 歷史索引](CHANGELOG.md)

歷史已拆成：

- [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
- [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
- [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
- [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
- [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
- [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
- [V1.75～](docs/changelog/part-07-v1.75-onward.md)

之後新版本只需要在首頁更新「目前版本／最新進度」，詳細技術紀錄繼續寫入 CHANGELOG 分檔，就不會再發生首頁看起來卡在舊版本的問題。
