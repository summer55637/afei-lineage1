## V0.47 虛弱／劇毒／閃避術

V0.47 接入三組不依賴 MP／AttackMagic 的正權重 Enemy PetSkill：

- 575「虛弱」：`PETSKILL_Weaken`，`虚 turn 3 成 50`
- 576「全體虛弱」：同函式／同 option，目標為敵方整側
- 577「劇毒」：`PETSKILL_Deeppoison`，`剧 turn 5 成 50`
- 578「全體劇毒」：同函式／同 option，目標為敵方整側
- 595「閃避術」：`PETSKILL_SetDuck`，`3|60`

### 575／576 虛弱

原 `BATTLE_S_Weaken()` 解析 `turn` 與 `成` 後，呼叫：

`BATTLE_MultiParamChangeTurn(..., status, ..., turn, Success)`

`BATTLE_MultiParamChangeTurn()` 對每個目標各做：

`BATTLE_StatusAttackCheck(attacker,target,status,Success,30,1.0,...)`

成功後寫入：

`CHAR_WORKWEAKEN = turn + 1`

原能力重算路徑在虛弱存在時會：

- `FIXSTR × 0.8`
- `FIXTOUGH × 0.8`
- `FIXDEX × 0.8`

然後再把這三項寫入戰鬥攻擊／防禦／敏捷。V0.47 因此只在 battle view 套 0.8，不污染永久角色能力值。

575 使用單體目標；576 依 skill target=3 對玩家側所有存活 Battle Entry 逐一判定。

### 577／578 劇毒

原 `PETSKILL_Deeppoison()` 不是一般 Poison StatusChange，而是呼叫：

`BATTLE_MultiStatusChange(..., status, turn + 2, ..., Success)`

所以 `turn 5` 實際寫入的狀態值是 7。

原 `BATTLE_StatusSeq()` 每次輪到該單位時會先把狀態值減 1，再處理劇毒：

- 狀態值 6、5、4、3、2：各做一次與普通中毒相同的扣血公式
- 狀態值降到 1：若仍未解除，直接令 HP=0
- 若進入劇毒處理時 HP 已 <=1，也直接令 HP=0

因此資料文字『中毒5回合，第六回合前未解則陣亡』與 C 程式實際行為一致。

V0.47 用 raw `turn+2` 倒數保留這個節奏；不是簡化成套五回合後瞬間死亡。

577 為單體；578 為敵方整側。命中判定同樣使用 `Success=50 / range=30 / bai=1.0`。

### 595 閃避術

`PETSKILL_SetDuckChange_Battle()` 明確要求施術目標就是自己；若已有 `CHAR_MYSKILLDUCK > 0`，再次施放不刷新。

option `3|60` 代表：

- 回合數：3
- power：60

真正回避判定在 `BATTLE_CheckMySkillDuck()`，而且發生在普通 DEX 回避公式之前：

`rad = rand() % 100`

`rad > power` → 失敗

`rad <= power` → 直接回避

所以 power=60 的成功值為 0～60，共 **61/100**，不是 60%。

若這個獨立判定失敗，才繼續原本的普通回避公式。

回合數在 `BATTLE_StatusSeq()` 尾端每次自己行動時減 1；技能施放當回合是在 StatusSeq 後才寫入，因此有效區間涵蓋施放回合與之後兩輪，第三次未來自身行動開始前歸零。

V0.47 以 Enemy 專屬 `skillDuckTurns / skillDuckPower` 保存，不把它錯誤轉成一般 `duckBonus +60`。

### 正權重覆蓋

| Skill | distinct Enemy ID | 正權重總和 |
| --- | ---: | ---: |
| 575 | 6 | 9 |
| 576 | 1 | 3 |
| 577 | 1 | 3 |
| 578 | 2 | 6 |
| 595 | 2 | 5 |

本輪仍未接 580「沉默」：雖然其狀態命中公式已可確認，但原效果核心是禁止非寵物使用咒術頁／施法；在 web 的正式咒術 command 尚未完成前，先不造一個沒有實際作用的假沉默。

## V0.48 淨化／浴血狂襲／排序回歸

V0.48 接入兩個不依賴 MP／AttackMagic、且原 C 路徑完整的正權重技能：

- 592「淨化」：`PETSKILL_Refresh`，option `全`，target=2（ALLMYSIDE）
- 659「T浴血狂襲」：`PETSKILL_DamageToHp2`，option `100`

同時修正前版兩個出手排序差異：

- 542 疾速攻擊：`BATTLE_DexCalc()` 專用 `work + 30%`
- 659 浴血狂襲：`BATTLE_DexCalc()` 專用 `work + 20%`

### 592 淨化

`aszStatus[0]` 明確是「全」。`BATTLE_S_Refresh()` 解析到 status=0 後呼叫 `BATTLE_MultiStatusRecovery()`。

592 的 target=2 對應 `PETSKILL_TARGET_ALLMYSIDE`，因此 Enemy 使用時只處理自己這一側。

`BATTLE_MultiStatusRecovery()` 逐一檢查同側目標目前的 StatusTbl 異常並清 0。原戰鬥系統的異常互斥使同一目標通常只會有一個主要 StatusTbl 異常，因此 web 版直接清除該 Enemy 的目前 battle status。

這個技能不造成傷害，也不進普通 Counter loop。

### 659 T浴血狂襲

同序列資料：

`T浴血狂袭, ... PETSKILL_DamageToHp2,100`

原 `PETSKILL_DamageToHp2()` 本身只下 `BATTLE_COM_S_DAMAGETOHP2`；真正特例分散在排序、AttackSeq 與吸血函式。

#### 出手排序

`BATTLE_DexCalc()`：

`work = CHAR_WORKQUICK + 20`

`dex = work + work * 0.2`

這個 command 不走普通 default 的 `work - RAND(0, work*0.3)`。

#### 會心與攻擊

`BATTLE_AttackSeq()` 先做普通閃避與 Guardian，再先計算正常 `BATTLE_CriticalCheck()`。之後若 command 是 DamageToHp2：

- `perCri = perCri + perCri*0.3`
- `WORKATTACKPOWER = FIXSTR + FIXSTR*0.2`
- `WORKQUICK = FIXDEX + FIXDEX*0.2`

CriticalCheck 本身讀的是 `FIXDEX`，所以 +20% QUICK 不會再反過來提高基礎會心；真正會心增幅就是已算好的 perCri 再 ×1.3。

另外 `BATTLE_CriticalCheck()` 會先把 per 上限壓到 10000，DamageToHp2 再乘 1.3，來源並沒有再次 cap。V0.48 同樣不重新封頂。

#### 吸血

`BATTLE_S_DamageToHp2()` 直接把 option 轉百分比：

`heal = Damage * atoi(option) / 100`

659 option=100，所以回復本次傷害的 100%，最高不超過自身 maxHP。

此技能是 `BATTLE_S_AttackDamage()` 的獨立 command case，battle.c 執行後直接 break，因此不人工加入普通 Counter loop。

### 排序回歸修正

前版曾依 `PETSKILL_SpeedyAttack()` 沒有解析「敏%」而保持 QUICK 不變；重新追到 `BATTLE_DexCalc()` 後確認，542 疾速攻擊仍有 command 專用排序：

`dex = (WORKQUICK + 20) + 30%`

所以 V0.48 新增 command-specific dex mode，只影響回合排序，不把 +30% 當成永久 QUICK buff。

另外 V0.47 的虛弱雖已讓 battle view 攻／防／敏 ×0.8，但 Enemy 排序原本仍直接讀 raw unit.quick。V0.48 改成排序讀當前 enemy battle view，讓虛弱確實影響 Enemy 出手順序。

### 本輪明確暫緩

- 573 救援：HP 公式已確認，但 Enemy AI 對 `PETSKILL_TARGET_OTHER` 的實際敵我側選目標仍需再對齊，不猜目標。
- 582 自爆攻擊：來源 `version.h` 直接標註 `_SKILL_SELFEXPLODE // (不可开) ... 自爆(缺图)`，且本來源沒有可執行函式，因此不按資料文字硬做。

## V0.49 鐵壁／銅牆／大地鎧甲

V0.49 接入三個 Enemy AI 有正權重、且效果完全由 battle 狀態欄位完成、不依賴外部 magic.txt / attmagic.bin 的防禦支援技：

- 552「鐵壁」：`PETSKILL_MagicStatusChange`，`铁壁|3|30|全`
- 565「銅牆」：`PETSKILL_MagicStatusChange`，`铁壁|5|40|全`
- 601「大地鎧甲」：`PETSKILL_SetMagicPet`，`3|15|TGH`

### 552／565 鐵壁系

`PETSKILL_MagicStatusChange_Battle()` 直接解析 option：狀態／turn／nums／單全，並呼叫 `BATTLE_MultiMagicStatusChange()`。

來源 `MagicStatus[]` 中「鐵壁」對應 `CHAR_MAGICSUPERWALL`。對 ALLMYSIDE 每個目標：

- 若任何 MagicTbl 狀態已存在，跳過，不刷新
- 否則 `CHAR_MAGICSUPERWALL = turn`
- `CHAR_OTHERSTATUSNUMS = nums`

物理傷害的真正效果在 `BATTLE_DamageCalc()`：

`def = (CHAR_OTHERSTATUSNUMS + rand()%20) / 100`

`defense += defense * def`

因此：

- 552 不是固定 +30% 防，而是每次物理傷害計算時 **+30～49%**
- 565 不是固定 +40% 防，而是每次物理傷害計算時 **+40～59%**

而且順序是先以 WORKDEFENCEPOWER ×0.70 取得防禦，再套鐵壁，之後才套來源的 Enemy 隨機防禦浮動。V0.49 已照此順序接入。

`BATTLE_MagicStatusSeq()` 在每名角色行動開始前把 MagicTbl 倒數 -1；降到 0 就清除。因此同回合早於目標行動前套上的鐵壁，會在該目標輪到行動時先扣一次，保留原始行動序時序。

### 601 大地鎧甲

`PETSKILL_SetMagicPet_Battle()` 對 ALLMYSIDE 解析：

- turn = 3
- nums = 15
- type = TGH

對每個目標先檢查 `CHAR_MYSKILLDUCK / STR / TGH / DEX`；任一已存在就跳過，不覆寫也不刷新。

成功目標寫入：

`CHAR_MYSKILLTGH = 3`

`CHAR_MYSKILLTGHPOWER = 15`

真正能力加成不在施法函式內。`CHAR_complianceParameter()` 會呼叫 `Other_DefcharWorkInt()`，其中：

`FIXTOUGH += baseTough * 15 / 100`

而 battle 每回合建立參數時會對場上每個角色重新呼叫 `CHAR_complianceParameter()`，再用 `BATTLE_TurnParam()` 建立 WORKDEFENCEPOWER。

因此來源實際時序是：

- 技能在某回合中途套上後，不會倒灌重算該回合已建立的 WORKDEFENCEPOWER
- 下一次 battle turn 建表時才把 TGH +15% 算進防禦
- `BATTLE_StatusSeq()` 尾端在角色自己行動時再把 `CHAR_MYSKILLTGH` 倒數 -1

V0.49 因此用「回合建表快照」保存大地鎧甲，而不是施放瞬間直接永久修改 unit.defense。

### 與虛弱／其他技能的順序

來源 `Other_DefcharWorkInt()` 先處理 MySkill TGH，再處理虛弱 ×0.8。V0.49 保留相同概念：先建立含大地鎧甲的本回合防禦，再由 battle view 套虛弱。

同時把本回合防禦型技能修正建立在大地鎧甲快照之上，避免疾速攻擊／狂亂暴走／撕裂／背水等技能把 TGH Buff 無意覆寫掉。

### 正權重覆蓋

| Skill | distinct Enemy ID | 正權重總和 |
| --- | ---: | ---: |
| 552 | 1 | 1 |
| 565 | 20 | 20 |
| 601 | 6 | 6 |

565 銅牆是目前剩餘支援技中使用面相對高的一筆。

### 仍不硬接

- 573 救援：公式已知，但 Enemy AI 的 `TARGET_OTHER` 實際側別目標仍需再確認。
- 582 自爆攻擊：此來源 `version.h` 明確標成不可開／缺圖，且缺可執行技能函式。
- 580 沉默：狀態本身可解析，但 web 尚未有正式咒術 command 可被禁止。

## V0.50 劇毒攻擊

V0.50 接入 ID 707「劇毒攻擊」：

- `PETSKILL_StatusChange`
- option：`剧 turn 6  攻%+20`
- Enemy AI：2 個 distinct Enemy ID，正權重總和 13

### 與 577／578 劇毒的差異

707 不是 `PETSKILL_Deeppoison`，而是一般 `PETSKILL_StatusChange`。

原流程先在技能準備階段解析 `攻%+20`，因此本回合攻擊力為基礎攻擊 +20%。接著走普通 `BATTLE_Attack()`。

只有物理攻擊造成正傷害後，`BATTLE_Attack()` 才呼叫一般：

`BATTLE_StatusAttackCheck(attacker,target,status,30,40,2.0,...)`

成功後寫：

`StatusTbl[deepPoison] = gBattleStausTurn + 1`

所以 `turn 6` 實際保存 raw 7。

577／578 則是獨立 `BATTLE_S_Deeppoison()`，會先把資料的 `turn 5` 改成 `turn + 2 = 7` 再交給 MultiStatusChange。

兩條路徑最後都可能得到 raw 7，但來源原因不同；V0.50 保留各自的原 C 路徑，不把兩種技能合併成一個假規則。

707 成功套上後仍沿用 V0.47 已完成的劇毒 StatusSeq：前五次狀態行動扣血，第六次仍未解除則倒下。

### 608 E旅程伙伴3 暫緩

608 已確認 option `80` 在 `_BATTLE_ABDUCTII` 下不是裝飾值。

當目標是寵物時，來源改用：

`CHAR_WORKFIXAI < 80` → `per = 200`

否則 `per = 0`。

目前 web 寵物資料沒有 `CHAR_WORKFIXAI`／忠誠／AI 的可對應欄位，因此不能拿等級或其他數值冒充。608 暫不接入，繼續遵守『缺底層就不猜』。

## V0.51 怯戰／狂獅怒吼

V0.51 接入兩個 Enemy AI 有正權重、且原 C 特殊攻擊分支已完整可還原的技能：

- 606「怯戰」：`PETSKILL_BattleTimid`，target=6
- 636「狂獅怒吼」：`PETSKILL_2BattleTimid`，option `-攻%50+敏%30命%60`，target=7

### 606 怯戰

`PETSKILL_BattleTimid()` 不是按資料文字做一般百分比差值，而是直接覆寫本回合戰鬥能力：

- `WORKATTACKPOWER = FIXSTR × 0.7`
- `WORKDEFENCEPOWER = FIXTOUGH × 0.4`
- `WORKQUICK = FIXDEX × 0.8`

因此資料文字雖寫「防禦力 50% 下降」，本來源程式實際只剩 **40% 防禦**；V0.51 以 C 程式為準。

此 command 沒有自己的 `BATTLE_DexCalc()` case，所以排序仍走 default：

`work = modifiedQuick + 20`

`dex = work - RAND(0, work*0.3)`

真正攻擊在 `BATTLE_S_AttackDamage()`。傷害結算完成後：

`timid = rand()%100`

`timid < 15 && damage > 1`

才觸發怯戰效果。

若目標是寵物：

- `BATTLE_PetDefaultExit()`
- `CHAR_DEFAULTPET = -1`

也就是寵物直接退出本場戰鬥。

若目標不是寵物（目前玩家側即 Player）：

- `BATTLE_Exit(defindex,battleindex)`
- `CHAR_DischargePartyNoMsg(defindex)`

也就是玩家本人被迫離開整場戰鬥。

Web 對應為：

- 寵物：加入 `battlePetOutIds`，本場不再出戰
- 玩家：直接結束目前 battle，不計勝利、EXP 或掉落，保留本次已受到的傷害

此技能是獨立 `BATTLE_S_AttackDamage` case，結束後直接 break，不進普通 Counter loop。

### 636 狂獅怒吼

`PETSKILL_2BattleTimid()` 的 option parser 對：

`-攻%50+敏%30命%60`

實際處理為：

- `-攻%50` → `WORKATTACKPOWER = FIXSTR × 0.50`
- `+敏%30` → `WORKQUICK = FIXDEX + FIXDEX×0.30`
- `命%60` → 退寵判定基準 60

沒有防禦 token，所以本回合防禦維持原值。

它同樣沒有專用 DexCalc case，因此用 **130% QUICK** 再走普通 default 隨機排序。

傷害後：

`rand()%100 < 60 && damage > 1`

才進特殊效果；但來源只有 `CHAR_TYPEPET` 分支真正執行。

對寵物會呼叫：

`BATTLE_PetIn(battleindex, defNo-5)`

而原 `BATTLE_PetIn()` 內部確實會：

- `BATTLE_PetDefaultExit(owner,battleindex)`
- `CHAR_DEFAULTPET = -1`

所以它就是把出戰寵物收回寵物欄。

對玩家本人，即使 60% 判定成功，也沒有 `BATTLE_Exit` 或其他附加效果，只保留本次傷害。

### 正權重覆蓋

| Skill | distinct Enemy ID | 正權重總和 |
| --- | ---: | ---: |
| 606 | 1 | 3 |
| 636 | 2 | 2 |

### 仍未接入

- 211 捐獻：已追到 `CHAR_getDefaultChar()`，所有 work-int 預設其實是 **0**，不是 -1；而 `CHAR_WORKPLAYERINDEX` 正好共用 `CHAR_NPCWORKINT1`。Enemy 建立流程沒有另行覆寫它，所以 `BATTLE_StealMoney()` 讀到的 masterindex 是 0。若伺服器 runtime 的 character index 0 當下有有效玩家，來源甚至可能把該玩家誤當主人；若 index 0 無效才會早退。這是依賴伺服器配置／連線分配的來源 bug，web 沒有可等價的 server character index，因此不能武斷固定成 no-op 或偷錢。
- 574 嚙齒術：物理攻擊本身可還原，但核心附加效果是玩家裝備 durability／損壞／消失；web 尚未有對等耐久系統。
- 610／611 光鏡系：依賴 VANISH／REFLEC 等 DamageReact 狀態，尚未建模。
- 625 媚惑術：成功條件與 31% 判定已確認；主要效果是把寵物變成小狐狸並限制只能攻擊／防禦／待機。來源 `BATTLE_DexCalc()` 雖先寫 fox dex ×0.8，但後續普通 command 的 default 分支會再次賦值而覆蓋它；目前 web Active Pet 本來就只有普通攻擊，尚無可被禁用的 PetSkill 指令，因此先不製造假的「敏 -20%」效果。
- 635 黑烏力化：只作用玩家，option `30 180 100388` 對應 30%／180 秒／圖號；核心限制是禁止咒術與職業技能，且持續時間走即時秒數。web 尚無正式咒術／職業技能 command 與跨戰鬥秒數變身系統，暫緩。
- 627／632／637／705 `PETSKILL_Combined`：同序列 option 分別為 `综合法|6|21|139|159|169|179|189`、`综合法|1|240`、`综合法|1|61`、`综合法|1|230`。原 `PETSKILL_Combined()` 不自行執行名稱描述的效果，而是隨機／直接取其中一個數字寫入 `CHAR_WORKBATTLECOM3`，並把 command 設為 `BATTLE_COM_JYUJYUTU`；因此它們本質上直接依賴咒術／魔法底層，不能把「淨化之舞／逆轉／調和」文字拿來仿造效果。

## V0.52 缺失 PetSkill／C_WAIT

V0.52 處理的是原資料裡一批長期被誤認為「未知技能」的 Enemy AI PetSkill。

重新對照本專案採用的原 C build：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `version.h` 明確啟用 `_PETSKILL_OPTIMUM`
- `setup.cf` 在 `_PETSKILL2_TXT` 下讀 `gmsv/data/petskill2.txt`

### `_PETSKILL_OPTIMUM` 真正行為

`PETSKILL_initPetskill()` 讀每一列時，直接把該列的 `PETSKILL_ID` 當成 `PETSKILL_petskill[]` 的 array index。

不存在的 ID 槽位會保持初始化值 `-1`。

`PETSKILL_getPetskillArray(petskillid)` 在此 build 內：

`return PETSKILL_petskill[petskillid].data[PETSKILL_ID]`

因此如果 Enemy 的 PetSkill 欄位引用一個 `petskill2.txt` 根本沒有的 ID，回傳就是 `-1`。

`PETSKILL_Use()` 隨後：

`array = PETSKILL_getPetskillArray(petskillid)`

`if (array == -1) return FALSE`

### AI 抽到缺表技能時不是普通待機

`BATTLE_AllCharaCWaitSet()` 每回合先把所有角色：

- `COM1 = BATTLE_COM_NONE`
- `BATTLEMODE = BATTLE_CHARMODE_C_WAIT`

Enemy AI 之後才呼叫 `PETSKILL_Use()`。

若缺表技能令 `PETSKILL_Use()` 回 FALSE，`BATTLE_ai_normal()` 也回 FALSE；`BATTLE_ai_all()` 不會把該 Enemy 改成 `BATTLE_CHARMODE_C_OK`。

`BATTLE_Battling()` 建立行動序列時雖仍會算 Dex，但真正輪到該角色時先檢查：

`if (CHAR_WORKBATTLEMODE != BATTLE_CHARMODE_C_OK) continue;`

這個判斷位於 `BATTLE_StatusSeq()` 與 `BATTLE_MagicStatusSeq()` **之前**。

所以來源實際效果是：

- 該 Enemy 本回合完全不行動
- 不執行普通 `BATTLE_COM_NONE` 動畫流程
- 不執行自身 StatusSeq
- 不遞減毒／劇毒／虛弱／魔障等 battle status
- 不遞減鐵壁／大地鎧甲等在角色行動點處理的倒數

這和「合法 PETSKILL_None」不同；合法 None 會先成為 C_OK，之後才在 BATTLE_Battling 內走 StatusSeq + NoAction。

### 原 petskill2.txt 缺失、但 Enemy AI 有正權重的 ID

| ID | distinct Enemy ID | 正權重總和 | 正權重槽位 |
| ---: | ---: | ---: | ---: |
| -1 | 110 | 227 | 221 |
| 515 | 11 | 44 | 20 |
| 513 | 5 | 25 | 5 |
| 589 | 9 | 21 | 10 |
| 512 | 5 | 20 | 5 |
| 518 | 2 | 20 | 6 |
| 114 | 12 | 16 | 16 |
| 111 | 3 | 16 | 5 |
| 511 | 5 | 15 | 5 |
| 112 | 3 | 15 | 3 |
| 645 | 10 | 10 | 10 |
| 510 | 5 | 10 | 5 |
| 113 | 1 | 6 | 1 |
| 560 | 1 | 6 | 2 |
| 509 | 5 | 5 | 5 |
| 18 | 1 | 5 | 2 |
| 729 | 4 | 4 | 4 |
| 745 | 4 | 4 | 4 |
| 559 | 1 | 4 | 2 |
| 65 | 3 | 3 | 3 |
| 558 | 1 | 3 | 3 |
| 588 | 1 | 1 | 1 |

V0.52 新增 `ENEMY_SOURCE_MISSING_SKILL_IDS`，當 Enemy AI 抽中以上 ID 時，直接標記為 `sourceSkillMissing`。

在 attack／guard／capture 三條 normalBattleOrder 路徑中，會在 `processBattleStatusTurn()` 前跳過該 Enemy，對齊原 C 的 C_WAIT 行為。

### 這次也釐清了先前的「未知技能」誤區

515／513／589／512／518 等不是另一張尚未找到的技能表，也不是可以用編號推算的隱藏技能。

在這個 build 裡，它們就是 **Enemy 資料引用了不存在的 PetSkill ID**。

因此後續不再為這批 ID 猜名稱、猜函式或嘗試補假效果。

## V0.53 救援／EnemyHELP

V0.53 接入 ID 573「救援」並補正 502 `ENEMYSKILL_EnemyHELP` 的原函式大小寫。

### 573 救援

原 petskill2：

`救援,牺牲自己50%的HP　　补至他人身上,PETSKILL_Sacrifice,,,Af,573,1,1,2,10000,PETSKILL_SACRIFICE`

`PETSKILL_Sacrifice()` 先檢查：

`CHAR_HP > CHAR_WORKMAXHP * 0.2`

只有嚴格大於 20% maxHP 才會成功把 command 設為 `BATTLE_COM_S_SACRIFICE`。

若 HP 不高於 20%，函式直接 `return FALSE`。

對 Enemy AI 而言這個 FALSE 發生在 `BATTLE_ai_all()` 階段；因此和 V0.52 缺表技能相同，Enemy 不會從 C_WAIT 變成 C_OK，該回合在 StatusSeq 前直接被跳過。

V0.53 因此新增 `sourceSkillRejected / sacrifice-low-hp` C_WAIT 分支，而不是把它當成普通「技能失敗動畫」。

### Enemy 使用救援的目標方向

原 `BATTLE_ai_normal()` 先從**對手側 Entry**依 tactics 選出 `result->target`，之後才呼叫：

`PETSKILL_Use(charaindex, skillSlot, result->target, NULL)`

`PETSKILL_Sacrifice()` 本身完全不重選友軍，也不檢查同側。

所以 Enemy AI 抽到 573 時，來源實際上會把玩家或玩家出戰寵物當作救援目標。

這個結果雖然和技能文字直覺相反，但 V0.53 以原執行路徑為準，不改成「自動補 Enemy 隊友」。

### 成功時 HP 公式

`BATTLE_S_Sacrifice()`：

`attacker HP = attacker HP * 0.5`

接著：

`target HP = min(attacker new HP + target HP, target maxHP)`

最後 `Damage = attacker new HP`，也就是畫面顯示／轉移基準用的是**施術者對半後剩餘 HP**。

例如施術者目前 101 HP：

- 施術後自身變 50 HP（C int 截斷）
- 轉移基準也是 50
- 目標最多增加 50 HP，仍受 maxHP 上限限制

即使目標已滿血，施術者仍照樣先損失一半目前 HP。

此技能沒有物理攻擊，也不進普通 Counter loop。

### 502 EnemyHELP 大小寫

原 petskill2 的函式字串是：

`ENEMYSKILL_EnemyHELP`

先前 fallback 寫成 `ENEMYSKILL_EnemyHelp`。目前 generated runtime 沒有 500～502，所以實際遊戲仍會使用 fallback，功能沒有中斷；但若未來 runtime 補齊 502 原字串，舊 dispatch 會因大小寫不符而漏接。

V0.53 已改為：

- fallback 使用原字串 `ENEMYSKILL_EnemyHELP`
- dispatch 同時接受 `EnemyHelp` 與 `EnemyHELP`

避免未來資料補齊後反而失效。

## V0.54 媚惑術／PETFLG

V0.54 接入 ID 625「媚惑術」在 **Enemy AI → 玩家側** 的原 C 實際行為。

原 petskill2：

`媚惑术,使宠物变成小狐狸,PETSKILL_BecomeFox,,,Ae,625,1,1,2,3000,PETSKILL_NONE`

### 先攻擊，再判定是否變狐

`PETSKILL_BecomeFox()` 本身只設定：

- `BATTLE_COM_S_BECOMEFOX`
- 原 AI 已選定 target
- skill array

`battle.c` 把 `BATTLE_COM_S_BECOMEFOX` 放在普通物理攻擊群組中。

進入真正 `BATTLE_Attack()` 前，除 Charge／EarthRound 等少數例外外，command 會被改回：

`BATTLE_COM_ATTACK`

因此它會正常：

- 物理命中／閃避／會心
- 造成普通物理傷害
- 進入 `BATTLE_Counter()` 反擊／反反擊鏈

變成小狐狸的判定是在整段普通攻擊／Counter 流程之後才做。

### 變狐必要條件

來源要求同時成立：

- 本次結果不是 MISS
- 不是 DODGE
- 不是 ALLGUARD
- 不是 ARRANGE
- 目標仍存活
- `rand()%100 < 31`
- 目標 `CHAR_WHICHTYPE != CHAR_TYPEPLAYER`
- 目標 `CHAR_WORK_PETFLG != 0`

因此玩家本人一定不可能被 625 變狐。

### 玩家寵物的 PETFLG 為什麼也是 0

`CHAR_WORK_PETFLG` 與 `CHAR_NPCWORKINT1` 共用 work-int。

來源全域搜尋顯示，真正寫入 `CHAR_WORK_PETFLG` 的戰鬥資料流程是 `ENEMY_createEnemy()`：

`CHAR_setWorkInt(newindex, CHAR_WORK_PETFLG, ENEMY_PETFLG)`

而玩家捕獲後的寵物是透過 `PET_createPetFromCharaIndex()` 重新建立一個新的 `CharNew`：

- `CHAR_getDefaultChar(&CharNew,31010)`
- `CHAR_getDefaultChar()` 把所有 `workint[]` 初始化為 0
- 再複製 HP／能力／屬性／PetSkill 等 data
- **沒有複製 Enemy 的 work-int / PETFLG**
- 後續只設定 `CHAR_WORKPLAYERINDEX` 等玩家寵物欄位

整個來源也找不到其他會替一般玩家寵物補設 `CHAR_WORK_PETFLG` 的路徑。

所以玩家出戰寵物的 `CHAR_WORK_PETFLG` 是 0。

### Web 對應

目前玩家側正是 Player + Active Pet：

- Player：因 `CHAR_TYPEPLAYER` 條件失敗
- Active Pet：因來源等價 `PETFLG=0` 條件失敗

因此 Enemy 使用 625 時，來源可觀察到的效果就是 **一發普通物理攻擊**。

V0.54 沒有建立假的 fox status，也沒有套用資料文字推測的變身效果；直接沿用 `performEnemyPrimaryAttack()`，並把 `counterEligibleThisTurn=true`，保留普通 Counter 鏈。

如果未來 web 加入來源中的 Enemy-side PETFLG 寵物／特殊 NPC 寵物成為玩家側目標，再另外接真正變狐狀態即可；目前不提前猜。

## V0.55 旅程伙伴3／FIXAI

V0.55 接入 ID 608「E旅程伙伴3」，並新增一張只服務於原忠誠 AI 計算的小型 runtime：

`data/generated/stoneage_pet_modai.json`

來源：

- repo：`gavinlinasd/StoneAge`
- ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/enemybase1.txt`
- 欄位：`E_T_MODAI`

原 `enemybase1.txt` 有 1,816 筆可解析列、1,813 個唯一 TempNo；同 TempNo 的重複列沒有 MODAI 衝突。

### FIXAI 原公式

`CHAR_initcharWorkInt()` 對 `CHAR_TYPEPET`：

1. `WORKFIXAI = 0`
2. 取得主人 `CHAR_WORKPLAYERINDEX`
3. `modai = CHAR_MODAI`；若 `modai <= 0` 則改 100
4. `R = 1.10`
5. `ai = ((主人等級 × 主人 WORKFIXCHARM × R) / (寵物等級 × modai)) × 100`
6. 指派到 C int，所以先截斷
7. `ai > 100` 時先壓到 100
8. 再加 `CHAR_VARIABLEAI × 0.01`
9. 若主人有轉生再套轉生補正
10. 最後 clamp 0～100

目前 web 沒有玩家轉生系統，捕獲／任務寵也沒有 VariableAI 調整，所以現況兩項等價來源值 0；不是自行省略數值。

玩家的 `state.charm` 對應目前無裝備修正下的 `WORKFIXCHARM`。

### 608 `_BATTLE_ABDUCTII`

原 petskill2：

`E旅程伙伴3,...,PETSKILL_Abduct,80,...,608,...`

且 `version.h` 明確：

`#define _BATTLE_ABDUCTII`

`BATTLE_Abduct()` 在 option >0 且目標為 `CHAR_TYPEPET` 時，不再走普通旅程伙伴的等級差成功率。

來源改成：

`AiPer = atoi(option)`

`per = 0`

`if (target WORKFIXAI < AiPer) per = 200`

608 的 AiPer=80，因此：

- FIXAI <80 → per=200
- FIXAI ≥80 → per=0

真正成功判定仍是：

`RAND(1,100) < per`

所以 200 是實質必成功，0 是實質必失敗。

### 目標與離場

若 AI 原本選到玩家本人，`BATTLE_Abduct()` 對 `CHAR_TYPEPLAYER` 直接 return；施術者也不離場。

若目標是玩家出戰寵物：

- FIXAI 依上述公式計算
- 成功時把寵物退出本場
- 失敗時寵物留下
- **不論成功或失敗，施術 Enemy 最後都 `BATTLE_Exit()`**

V0.55 保留這個來源行為。

### 舊存檔／無 TempNo 防護

若舊版 legacy pet 沒有 TempNo，或 TempNo 無法對回 `enemybase1.txt`，web 無法安全重建 MODAI。

這種情況 V0.55 不猜 FIXAI 成敗：不擅自帶走寵物，但仍執行來源已確定的施術 Enemy 離場。

### V0.54 補充確認

V0.54 625 媚惑術的 Player/Pet 判斷再次由 `PET_createPetFromCharaIndex()` 驗證：

- 捕獲後玩家寵物重新建 Char
- work-int 全由 default char 初始化成 0
- 不複製 Enemy 的 `CHAR_WORK_PETFLG`

因此一般玩家寵物確實無法滿足 BecomeFox 的 `WORK_PETFLG != 0` 條件。

## V0.56 光鏡系 no-react 分支

V0.56 接入：

- 610「破鏡重圓」：`PETSKILL_Lighttakeed`，option `REFLEC`
- 611「穿透術」：`PETSKILL_Lighttakeed`，option `VANISH`

`version.h` 已啟用：

`#define _BATTLE_LIGHTTAKE`

### 技能前置能力

`PETSKILL_Lighttakeed()` 直接：

- `WORKATTACKPOWER = FIXSTR × 0.7`
- `WORKDEFENCEPOWER = FIXTOUGH × 0.5`

原本 QUICK ×0.95 的程式已被註解，所以不改敏捷。

### DamageReact 判斷

`BATTLE_S_AttackDamage()` 一開始呼叫：

`ReactType = BATTLE_GetDamageReact(defindex)`

`BATTLE_GetDamageReact()` 順序檢查：

1. `CHAR_WORKDAMAGEVANISH > 0` → VANISH
2. `CHAR_WORKDAMAGEABSROB > 0` → ABSROB
3. `CHAR_WORKDAMAGEREFLEC > 0` → REFLEC

若三者皆 0，回傳 0。

Lighttakeed 只有當目標確實已有 DamageReact，且種類和 option 相同時，才保留 LIGHTTAKE command 並在攻擊後把該反應剩餘次數複製到施術者。

若種類不同，來源把 `skill_type=-1`；目標原本的 DamageReact 仍照一般傷害反應規則處理。

### 現版玩家側的來源等價狀態

目前 Player + Active Pet 沒有：

- WORKDAMAGEVANISH
- WORKDAMAGEABSROB
- WORKDAMAGEREFLEC

也沒有任何已接技能／裝備會建立這三個 work-int。

因此在目前戰鬥模型中，`BATTLE_GetDamageReact()` 對玩家與玩家寵物必定是 0。

這時 610／611 的原 C 實際行為就是：

- 用攻 70%、防 50% 的施術者
- 執行一次 `BATTLE_S_AttackDamage()` 普通物理傷害
- 不吸收任何 REFLEC／VANISH
- 不進一般物理攻擊分支的 Counter loop

V0.56 精準接這個 no-react 分支。

### 為什麼現在不建立假的 REFLEC／VANISH

技能名稱雖然叫「破鏡重圓／穿透術」，但 610／611 本身不是建立光鏡守的技能，而是**吸收目標已存在的 DamageReact**。

目前沒有來源會讓玩家側先取得這些 work-int，所以若現在自行建立 reflect／vanish status，就會改變原資料可到達狀態。

等正式接入能建立 `WORKDAMAGEREFLEC / VANISH / ABSROB` 的來源技能或裝備時，再擴充同一 handler 的 transfer 分支。

## V0.57 沉默／NOCAST

V0.57 接入 ID 580「沉默」：

`沉默,敌全体无法使用咒术三回合,PETSKILL_Nocast,默 turn 3 成 50,...`

此技能不依賴 AttackMagic 傷害表；它是獨立 battle status。

### 原 `BATTLE_S_Nocast()`

技能解析：

- `turn = 3`
- `Success = 50`
- `BATTLE_MultiList()` 取目標整側

每個目標先呼叫：

`BATTLE_StatusAttackCheck(attacker,target,BATTLE_ST_NOCAST,50,30,1.0,&perStatus)`

也就是：

- PerOffset = 50
- Range = 30
- Bai = 1.0
- 仍受既有異常互斥、等級差、VITAL 比例、LUCK／抗性公式影響
- 最終成功仍是嚴格 `< per`

接著原碼還要求：

`CHAR_WHICHTYPE != CHAR_TYPEPET`

所以即使 BATTLE_MultiList 包含玩家出戰寵物，寵物也不會被寫入沉默。

V0.57 保留原 C 的 `&&` 評估順序：寵物仍會先走一次 StatusAttackCheck 路徑，再因 type=PET 被排除。

### turn 不是 `turn+1`

這點和 Barrier／一般 StatusChange 不同。

`BATTLE_S_Nocast()` 成功後直接：

`CHAR_WORKNOCAST = turn`

也就是 raw 值直接寫 3。

因此 V0.57 使用 `battleStatusApplyRaw(...,'nocast',3)`，不是一般 `battleStatusApply()` 的 `turn+1`。

若施術者在本回合比玩家早出手，玩家同一回合輪到自己時 `BATTLE_StatusSeq()` 就會先把沉默 3 減成 2。

### 沉默不會讓角色停止行動

`BATTLE_StatusSeq()` 的 `CHAR_WORKNOCAST` case 只負責通知客戶端咒術頁維持禁用。

它不屬於麻痺／睡眠／石化／魔障等不能行動類型，也不把普通 Attack／Guard 改成 NONE。

因此 web 的 `battleStatusCanMove()` **沒有**把 nocast 加入阻擋清單。

目前玩家本來就沒有正式咒術 command 可按，所以 V0.57 不製造假的按鈕禁用效果；但沉默仍有來源可觀察意義：

- 佔用異常狀態互斥槽
- 阻止其他異常在沉默期間覆蓋
- 正常依玩家行動點倒數
- 到 0 自動解除
- 可被 592 淨化移除

### 玩家寵物

來源明確排除 `CHAR_TYPEPET`，所以 Active Pet 即使在「敵全體」範圍中也不會取得 nocast status。

### Counter

580 不造成物理傷害，也不走普通 Attack，因此沒有 Counter／反反擊鏈。

## V0.58 嚙齒術／無裝備分支

V0.58 接入 ID 574「E嚙齒術」在目前 web 戰鬥模型可到達的原 C 分支。

原 petskill2：

`E啮齿术,破坏对方装备武器,PETSKILL_ToothCrushe,,,Ed,574,1,6,2,0,PETSKILL_TOOTHCRUSHE`

`version.h` 已啟用：

`#define _SKILL_TOOTH`

### `PETSKILL_ToothCrushe()`

函式只設定特殊 command／target／skill array。

原本曾有一段降低施術者攻擊力的 option parser，但整段被 `/* ... */` 註解，所以本 build **沒有攻擊力修正**。

### 戰鬥路徑

`battle.c` 對 `BATTLE_COM_S_TOOTHCRUSHE`：

1. `BATTLE_TargetAdjust()`
2. `BATTLE_S_AttackDamage(...,BATTLE_COM_S_TOOTHCRUSHE,skill)`
3. 直接 `break`

所以它是特殊 AttackDamage case，不是普通 `BATTLE_COM_ATTACK`，不接一般 Counter／反反擊鏈。

物理命中／閃避／會心／傷害則仍由 `BATTLE_AttackSeq()` 正常計算。

### 額外裝備破壞

只有 damage >0 時 `skill_type` 才能維持 TOOTHCRUSHE；接著輸出階段才呼叫：

`BATTLE_S_ToothCrushe(battleindex, attackindex, defindex, damage, skill)`

而 `BATTLE_S_ToothCrushe()` 第一個條件就是：

`if (target WHICHTYPE != CHAR_TYPEPLAYER) return;`

即使是玩家，仍要：

`BATTLE_ItemCrushCheck(defindex,1) >= 0`

找到可破壞裝備後才會讀 ITEM_DAMAGECRUSHE／MAXDAMAGECRUSHE、調降耐久，甚至耐久歸零時刪除裝備。

### 現版 web 的來源等價狀態

目前玩家沒有正式武器／防具裝備欄與耐久資料。

因此：

- 目標若是 Active Pet：來源本來就直接 return，不破壞任何東西
- 目標若是 Player：等價於 `BATTLE_ItemCrushCheck()` 找不到可破壞裝備

所以 V0.58 精準保留：

- 一次特殊物理攻擊
- 無裝備破壞
- 無普通 Counter loop

沒有自行建立假的武器或耐久值。

等正式裝備系統與 ITEM_DAMAGECRUSHE 底層存在後，再把同一 handler 的 crush 分支補上。

## V0.59 未註冊 PetSkill／C_WAIT

V0.59 修正兩個「petskill2.txt 有資料列，但原 build 實際找不到函式指標」的 Enemy PetSkill：

- 502「E招喚」
- 582「自爆攻擊」

### 502 E招喚

`petskill2.txt` 的函式字串是：

`ENEMYSKILL_EnemyHELP`

但 `PETSKILL_functbl[]` 註冊的是：

`ENEMYSKILL_EnemyHelp`

`PETSKILL_getPetskillFuncPointer()` 用 `hashpjw()` 後仍會再做：

`strcmp(PETSKILL_functbl[i].functionname, name) == 0`

`strcmp` 區分大小寫，所以 `EnemyHELP` 不會命中 `EnemyHelp`。

結果：

- `func == NULL`
- `PETSKILL_Use()` 回 FALSE
- `BATTLE_ai_normal()` 回 FALSE
- Enemy 不會被設成 C_OK
- 本回合維持 C_WAIT
- 在 `BATTLE_StatusSeq()` 前就被跳過

因此 V0.53 曾保留的 `performEnemyHelp()` 只作為未來若修正資料字串時的可用 handler；**這個原 build 的 502 不會實際進到它**。

### 582 自爆攻擊

`petskill2.txt`：

`自爆攻击,...,PETSKILL_SelfExplodeAttack,倍3 回避-50,...,582,...`

但本來源：

- `pet_skill.c` 沒有 `PETSKILL_SelfExplodeAttack()`
- `PETSKILL_functbl[]` 也沒有 `PETSKILL_SelfExplodeAttack` 註冊項
- `version.h` 只有被註解掉的：

`//#define _SKILL_SELFEXPLODE // (不可开) ... 自爆(缺图)`

所以 582 同樣會在 `PETSKILL_getPetskillFuncPointer()` 得到 NULL，`PETSKILL_Use()` 回 FALSE。

### V0.59 Web 對應

新增：

`ENEMY_SOURCE_UNREGISTERED_SKILL_IDS = {502, 582}`

Enemy AI 抽中這兩個 ID 時：

- 標記 `sourceSkillUnregistered`
- 不執行 handler
- 保持來源 C_WAIT
- 不攻擊
- 不跑自身 StatusSeq／MagicStatusSeq
- 不推進毒、劇毒、虛弱、鐵壁、大地鎧甲等自身行動點倒數

這和 V0.52 的「技能 ID 根本不存在」是不同資料錯誤，但最終 battle 行為相同。

## V0.60 黑烏力化

V0.60 接入 ID 635「黑烏力化」：

- 函式：`PETSKILL_BecomePig`
- option：`30 180 100388`
- Enemy AI：1 個 distinct Enemy，正權重總和 1

### 原技能流程

`PETSKILL_BecomePig()` 本身只設定 `BATTLE_COM_S_BECOMEPIG`、target、C_OK 與 skill array。

`battle.c` 把 BECOMEPIG 放在普通物理攻擊 command 群組，所以會先完整執行：

- 普通命中／閃避／會心
- 物理傷害
- 普通 Counter／反 Counter 鏈

之後才檢查黑烏力化附加效果。

### 只有玩家本人能被黑烏力化

附加效果要求：

- 本次不是 MISS
- 不是 DODGE
- 不是 ALLGUARD
- 不是 ARRANGE
- 目標仍存活
- 目標 `CHAR_WHICHTYPE == CHAR_TYPEPLAYER`
- 非同隊

所以打中玩家寵物時只有普通物理攻擊，不會套黑烏力化。

### option `30 180 100388`

原碼解析為：

- `petrate = 30`
- `pettime = 180` 秒
- `pigbbi = 100388`

成功判定是：

`rand()%100 < 30`

也就是 0～29，共 30/100。

第一次成功時原 `CHAR_BECOMEPIG` 初值為 -1：

`pettime + 1 + (-1) = 180`

若已有狀態，再次成功：

`CHAR_BECOMEPIG = pettime + current`

所以剩餘秒數會直接再加 180 秒。

### 真正限制哪些戰鬥指令

黑烏力化期間，原 `battle.c` 明確允許：

- ATTACK
- GUARD
- NONE
- ITEM
- ESCAPE
- CAPTURE
- WAIT
- PETIN
- PETOUT

只有其他指令才會被強制改成 GUARD，訊息寫的是「變成烏力後不能使用咒術和職業技能」。

此外武器會被視為 FIST，回力標也被改回一般攻擊。

目前 web 沒有武器系統、咒術 command、職業技能 command、騎寵系統；而玩家目前可用的攻擊／防禦／捕捉都在原允許清單。

因此 V0.60 **不添加任何攻擊／防禦／敏捷 debuff**，只保存真正存在的黑烏力秒數狀態。

### 秒數與戰鬥結束時序

來源 `net.c` 每秒把 `CHAR_BECOMEPIG` 減 1。

當倒數要降到 0：

- 先把值設為 0
- 若當時不在戰鬥，立刻設回 -1 並解除
- 若仍在戰鬥，不設 -1

`battle.c` 判定黑烏力化用的是 `CHAR_BECOMEPIG > -1`，所以**戰鬥中即使秒數已經倒到 0，狀態仍持續到離開戰鬥後才解除**。

V0.60 用 `playerPigUntilMs` 保存 wall-clock 到期時間；若時間已到但戰鬥仍存在，`playerPigActive()` 仍回 true，直到戰鬥離開後才清除。

這個欄位寫入存檔，故 180 秒狀態可以跨重新整理保留。

### Save schema

V0.60 將 `schemaVersion` 15 升為 16，新增：

- `playerPigUntilMs`
- `playerPigImage`

舊存檔透過 fresh-state merge 自動取得預設值，不需要破壞既有角色／寵物／任務資料。

### V0.60 正權重非 MP／魔法掃描邊界

以原 `gmsv/data/petskill2.txt`、`version.h`、實際 `PETSKILL_functbl[]` 與目前 Enemy AI 正權重重新交叉掃描後，V0.60 已沒有其他可在「不補 MP／AttackMagic／咒術底層」前提下安全新增的技能。

目前仍有正權重但未接入的來源函式只剩：

| 類型 | ID | 正權重總和 | 暫緩原因 |
| --- | --- | ---: | --- |
| `PETSKILL_AttackMagic` | 27 個（301～325 等） | 504 | 直接指定 magic ID + item ID，需正式 magic／attmagic 執行層 |
| `PETSKILL_MpDamage` | 506／507／508 | 196 | 技能本身會做物理攻擊，但核心附加結果直接修改目標 MP；玩家／寵物正式 MP 尚未建模 |
| `PETSKILL_Firekill` | 624 | 32 | 先做 80% 物理攻擊，再固定呼叫 `BATTLE_MultiAttMagic_Fire(...,2,200)`；不能只截掉後半魔法 |
| `PETSKILL_StealMoney` | 211 | 8 | Enemy 的 `CHAR_WORKPLAYERINDEX` 預設為 0；index 0 是否有效取決於原伺服器全域 Char runtime，前端沒有等價配置 |
| `PETSKILL_Combined` | 627／632／637／705 | 6 | 只是挑 option 內的咒術編號後改成 `BATTLE_COM_JYUJYUTU`，效果完全依賴咒術底層 |
| `PETSKILL_DivideAttack` | 634 | 5 | `BATTLE_DivideAttack()` 先把敵方所有玩家 MP 扣半，再做全側 HP 比例傷害並處理騎寵分攤 |

另外 502／582 雖有 petskill2 資料列，但原 build 的 functbl 無法取得函式指標，已由 V0.59 正式還原為 C_WAIT；V0.52 的缺 ID 引用也已同樣完成。

因此下一階段若繼續擴技能，應先建正式 MP／magic／JYUJYUTU 底層，而不是再從技能名稱猜效果。

## V0.61 AttackMagic 正式底層

V0.61 開始正式接入原版攻擊魔法，不再把 `PETSKILL_AttackMagic` 視為缺資料技能。

本輪新增：

`data/generated/stoneage_attack_magic_runtime.json`

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/magic.txt`
- `gmsv/data/attmagic.bin`

原 build 明確開啟：

- `__ATTACK_MAGIC`
- `_FIX_MAGICDAMAGE`
- `_MAGIC_OPTIMUM`

因此 V0.61 使用新版 FIX_MAGICDAMAGE 公式。

### attmagic.bin

`AttMagic` struct 全部由 32-bit 欄位組成：18 個 scalar + `siField[3][5]` 共 33 個欄位，每筆 132 bytes。

`attmagic.bin` 為 7128 bytes：

- 7128 / 132 = 54 raw records
- loader 再要求偶數並除 2
- 得到 27 個 attack-magic idx

每個 idx 兩筆：

- Enemy／左上方施法者 `attackNo >= 10` → `idx*2`
- Player／右下方施法者 `attackNo < 10` → `idx*2+1`

V0.61 runtime 已保存兩側 sprite、attackType 與原 `siField[3][5]`。

### magic 301～325

目前正式接入 25 個原 `MAGIC_AttMagic_Battle`：

- 301～306 地
- 307～312 水
- 313～318 火
- 319～324 風
- 325 毀天滅地（火，Power 350，MagicLv 5）

每筆直接保存 magic.txt 的：

- Magic ID
- name
- option
- field / target / deadFlag
- AttMagic idx
- 屬性
- Power
- MagicLv
- `TargetIndex` 特殊範圍 rewrite

### 範圍還原

不是只把魔法粗分成單體／全體。

V0.61 同時移植來源：

- `CharTable[4][5]`
- `CharTableIdx[20][2]`
- `attmagic.bin -> siField[3][5]`
- `TargetIndex[25][2]`

因此目前 Player slot 0 + Active Pet slot 5 能保留原格位語意。

回歸例：

- 301 岩石撞擊：選玩家只打玩家；選寵物只打寵物
- 303 土石流：整排；目前每排各只有一個可見單位
- 304 巨岩撞擊：十字範圍，無論選玩家或同欄寵物，Player + Active Pet 都會被波及
- 305 地震：敵方全體，Player + Active Pet 都受影響
- 321 龍捲風：整排
- 325 毀天滅地：敵方全體

### Enemy 魔法熟練度

原 `BATTLE_MultiAttMagic()` 對 `CHAR_TYPEENEMY`：

`att_magic_lv[attr] = CHAR_LV * 0.9`

寫入 int，所以 V0.61 使用截斷值。

每次施法共用一次：

`Check = rand()%100`

`TrueMagic = !(Check > att_magic_lv[attr])`

也就是 `Check <= attMagicLv` 才是 TrueMagic。

False 時，最後魔法傷害會再：

`attvalue *= 0.7`

並以 C int 規則截斷。

### 魔法閃避

玩家：

`fLuck = LUCK*3 + 해당屬性魔抗*0.15`

目前沒有裝備魔法迴避，所以 equipment 部分為來源等價 0。

寵物：

`fLuck = level*0.2`，上限 30。

真正判定：

`rand()%100 + 1 <= (int)fLuck`

成功則該目標本次魔法傷害為 0，且不進後續魔抗成長。

### `_FIX_MAGICDAMAGE` Power

對每一個沒有閃過的目標：

`Kmagic = attackerMagicLv*1.4 - defenderResist`

`Mmagic = max(attackerMagicLv,1)`

`Amagic = (Kmagic² / Mmagic²) + (rand()%20)/100`

`APower = int(Power * (1 + MagicLv/10) * Amagic)`

### 魔法屬性相剋

V0.61 沒直接重用物理 `normalizedElements()`。

原因是 `BATTLE_getMagicAdjustInt()` 會建立一個**非正規化攻擊屬性向量**：

- `MagicLv *= 10`
- 指定魔法屬性 = `MagicLv + MagicLv*(施術者該屬性/50)`
- `/50` 是 C int division
- 其他四屬中的三屬清 0
- 原本的 None 屬性仍保留
- 接著所有攻方屬性都乘 APower

再交給原 `BATTLE_AttrCalc()` 的 1.5／1.0／0.6 四屬相剋矩陣。

V0.61 新增 `magicAttrCalcRaw()`，逐項以 C int 截斷還原，不把魔法向量錯誤重新正規化回 100。

目前尚未接入 676 的戰場屬性改變，因此 `BattleArray.field_att` 在現況等價 NONE；`BATTLE_FieldAttAdjust()` 攻守雙方都是 0.5，比例正好為 1。

### 睡眠解除

原 `BATTLE_MultiAttMagic()` 只要目標沒有魔法閃避，就會加入 `def_be_hit`；整段結束後若該目標正在睡眠，直接清除睡眠。

V0.61 同樣在魔法未閃避時解除 sleep，即使最後傷害為 0 也不自行改規則。

### 魔抗成長

Save schema 由 16 升到 17。

玩家新增：

- `magicResist[4]`：地／水／火／風
- `magicResistExp[4]`

每隻寵物同樣保存這兩個陣列。

來源 default char 的整數欄位初始化為 0，且捕獲寵建立流程沒有額外複製魔抗，因此舊存檔與新寵預設四屬魔抗都為 0。

`Magic_ComputeDefExp()`：

- 單次傷害 <200：不成長
- `addEx = (Damage/20) * (MagicLv*2)`，`Damage/20` 為 C int division
- exp >100 時清 0，該屬性魔抗 +1，最高 100
- 同時處理 `(attr+1)%4` 的相克魔抗：若其 level >1，exp -2；若跌破 0，exp 設 90、level -1

V0.61 已把這套進度持久化到 save。

### 尚未包含

`PETSKILL_AttackMagic` 還有兩筆不是 `MAGIC_AttMagic_Battle`：

- 676 → magic 204：戰場水屬性改變
- 688 → magic 435：MAGIC_Weaken

這兩筆 V0.61 不會拿 AttackMagic 傷害公式硬套；下一步分別接 FieldAttChange 與正式 Magic Weaken。

### V0.61 MP／item runtime 補充確認

後續追 `MAGIC_DirectUse()` 時確認，PetSkill option 內的 `item 19647～19671` 對非玩家施術者會直接當成全域 `ITEM_item[]` existing-item index，並讀 `ITEM_MAGICUSEMP`。

若該 existing-item index 無效，`ITEM_getInt()` 會回 `-1`；`MAGIC_DirectUse()` 的 `if (mp < 0) {}` 區塊是空的，仍會把 `mp=-1` 傳進 magic function。

但這**不影響 V0.61 已接的 301～325**，因為原 `MAGIC_AttMagic_Battle(charaindex,toNo,marray,mp)` 從頭到尾完全沒有讀取 `mp`：

- 不做 `CHAR_MP < mp` 檢查
- 不扣 MP
- 直接解析 attr／Power／MagicLv／attidx
- 直接呼叫 `BATTLE_MultiAttMagic()`

所以 301～325 的原 build 行為確實與 dynamic item slot 內容、Enemy MP 都無關；V0.61 目前直接執行 AttackMagic 是正確的。

相對地，magic 204 `MAGIC_FieldAttChange` 與 magic 435 `MAGIC_Weaken` 都會檢查並扣傳入的 mp，因此 676／688 仍不能沿用 301～325 的無 MP 路徑，必須另外處理。


## V0.62 火線獵殺

V0.62 接入 Enemy 正權重 PetSkill 624「火線獵殺」。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/petskill2.txt`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_magic.c`

### PetSkill 資料

原 `petskill2.txt`：

- ID：624
- 名稱：火線獵殺
- function：`PETSKILL_Firekill`
- target：1
- option：空

`PETSKILL_Firekill()` 本身只設定 `BATTLE_COM_S_FIREKILL`、target、C_OK 與 skill array，不從 option 猜任何額外數值。

### 物理段

原 `battle.c` 的 `BATTLE_COM_S_FIREKILL`：

1. 先確認／調整有效目標。
2. 同隊目標直接拒絕。
3. 固定：
   `CHAR_WORKATTACKPOWER = CHAR_WORKFIXSTR * 0.8`
4. 呼叫 `BATTLE_Attack_FIREKILL()`。
5. 接著呼叫 `BATTLE_MultiAttMagic_Fire(battleindex,attackNo,defNo,2,200)`。
6. 直接結束該 command。

因此 V0.62 的物理段固定使用原攻擊力 80%，而且**不進普通物理攻擊的 Counter／反 Counter loop**。

`BATTLE_DamageSub_FIREKILL()` 內即使前面讀了 DamageReact，隨後也明確：

`react = BATTLE_MD_NONE`

所以目前 web 沒有額外自行加入鏡／守／吸收等反應。

### 火魔法段

`BATTLE_MultiAttMagic_Fire(...,2,200)` 的固定參數：

- `FieldAttr = 2` → 火
- `Power = 200`
- 函式內 `MagicLv = 4`
- 作用範圍為原目標所在的 5 格橫排

目前 web 戰鬥模型只有 Player slot 0 與 Active Pet slot 5，兩者位於不同排，因此現況：

- 選到玩家 → 火焰追加打玩家所在排
- 選到 Active Pet → 火焰追加打寵物所在排

不把它錯誤擴成 Player + Pet 全體。

### Enemy 魔法公式

Enemy 施術者仍依原碼：

`att_magic_lv = int(level * 0.9)`

每次火魔法段仍會先消耗一次：

`Check = rand()%100`

並計算 `TrueMagic`。

但 Firekill 專用 `BATTLE_MultiAttMagic_Fire()` 中，原本可能套用的：

`attvalue *= 0.7`

在 `_FIX_MAGICDAMAGE` 路徑實際上是註解碼，故 **FalseMagic 不降低 Firekill 傷害**。V0.62 保留該 RNG 消耗，但不自行加上 0.7。

真正傷害仍沿用 V0.61 已還原的：

- Enemy 魔法熟練度
- 玩家／寵物魔法閃避
- `_FIX_MAGICDAMAGE` 的 Kmagic / Mmagic / Amagic / APower
- 火屬性相剋
- 玩家／寵物魔抗成長
- 魔法命中後解除睡眠

### Save schema

V0.62 沒有新增持久化欄位，因此 schema **維持 17**。

### 正權重掃描更新

接入 624 後，V0.60 邊界中原先因缺正式 magic 底層而暫緩的 Firekill 已解除。

仍需後續處理的正權重技能集中在：

- 506／507／508：`PETSKILL_MpDamage`，需要正式 MP
- 676：`PETSKILL_AttackMagic -> magic 204`，FieldAttChange 且會檢查／扣 MP
- 688：`PETSKILL_AttackMagic -> magic 435`，Magic Weaken 且會檢查／扣 MP
- 211：`PETSKILL_StealMoney`
- 634：`PETSKILL_DivideAttack`，包含玩家 MP 減半
- 627／632／637／705：`PETSKILL_Combined`，依賴 JYUJYUTU／咒術底層

繼續維持「原 C 規則優先、不猜數值」；在正式 MP／JYUJYUTU 或可驗證 runtime 尚未建立前，不把這些技能偷換成普通攻擊或自行猜效果。


## V0.63 玩家 MP 與 MP攻擊

V0.63 建立最小但正式的玩家 MP runtime，並接入 Enemy 正權重 PetSkill 506／507／508。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/char/char.c`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/data/petskill2.txt`

### 玩家 MP 初始化

原 `CHAR_createNewChar()` 明確：

`ch.data[CHAR_MAXMP] = ch.data[CHAR_MP] = 100;`

而 `CHAR_initcharWorkInt()` 直接：

`CHAR_WORKMAXMP = CHAR_MAXMP`

現版 web 尚無 `ITEM_MODIFYMP` 裝備效果，因此 V0.63 不猜額外成長或職業公式，玩家固定：

- MP = 100
- MaxMP = 100

Save schema 由 17 升到 18，新增：

- `mp`
- `maxMp`

舊存檔因先前沒有 MP 系統，升級時安全初始化為 100／100。

休息補滿同步參照原 Healer 行為，把角色 HP 與 MP 都補滿。

### 506／507／508 原資料

`petskill2.txt`：

- 506 MP攻擊 → `PETSKILL_MpDamage` → `50|50`
- 507 MP攻擊2 → `PETSKILL_MpDamage` → `50|75`
- 508 MP攻擊3 → `PETSKILL_MpDamage` → `50|100`

第一欄看似是「物理攻擊力下降 50%」，第二欄是 MP 損害比例。

### 原 C 的整數除法 bug

`PETSKILL_MpDamage()` 實際寫法：

`def = (float)(atoi(buf1)/100);`

對三個技能第一欄都是 50，因此 C 會先做：

`50 / 100 = 0`

再轉為 float 0.0。

後續：

`strdef = strdef - (int)(strdef * def);`

所以這個來源 build 的 506／507／508 **實際不降低物理攻擊力**。

V0.63 保留這個來源行為，不依技能文字自行修成 -50%。

### MP 傷害條件

原 battle path：

`BATTLE_COM_S_MPDAMAGE -> BATTLE_S_AttackDamage() -> BATTLE_S_MpDamage()`

`BATTLE_S_MpDamage()` 只在以下條件成立時生效：

- 本次物理 `damage >= 1`
- 目標不是 Enemy
- 目標不是 Pet
- 也就是實際上只對 Player 生效
- 目標目前 MP > 0
- `BATTLE_GetDamageReact(defindex) == 0`

目前 web 玩家沒有光／鏡／守 DamageReact work-int，所以最後一項在現況來源等價為 true。

真正扣除：

`D_MP = (int)(currentMP * percent)`

然後：

`MP = MP - D_MP`

所以 506／507／508 分別扣「**當下剩餘 MP**」的：

- 50%
- 75%
- 100%

不是 MaxMP 百分比。

例如 100 MP 連續吃兩次 506：

- 第一次：100 → 50
- 第二次：50 → 25

### 物理與反擊

506／507／508 在 `battle.c` 走 `BATTLE_S_AttackDamage()` 專用 case，處理完直接 break，不進普通 `BATTLE_Attack` 的 Counter loop。

因此 V0.63：

- 保留正常物理命中／閃避／防禦
- 不額外建立普通 Counter
- 只有物理 damage > 0 時才接 MP 削減
- 打 Active Pet 時只造成物理傷害，不扣玩家 MP

### 正權重掃描更新

506／507／508 原正權重合計 196，V0.63 後已正式接入。

下一批仍需處理的重點：

- 676 → `PETSKILL_AttackMagic -> magic 204`：FieldAttChange，會檢查並扣 MP
- 688 → `PETSKILL_AttackMagic -> magic 435`：MAGIC_Weaken，會檢查並扣 MP
- 634 → `PETSKILL_DivideAttack`：會先把玩家 MP 減半，再處理 HP
- 211 → `PETSKILL_StealMoney`：仍受 Enemy `CHAR_WORKPLAYERINDEX` 無有效 owner 限制
- 627／632／637／705 → `PETSKILL_Combined`：依賴 JYUJYUTU／咒術底層

繼續維持「原 C 規則優先、不猜數值」。


## V0.64 分身地裂

V0.64 接入 Enemy 正權重 PetSkill 634「分身地裂」。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/petskill2.txt`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`

原資料：

- ID 634
- 名稱：分身地裂
- function：`PETSKILL_DivideAttack`
- target：敵方全體
- option：空

`PETSKILL_DivideAttack()` 只把 command 設成 `BATTLE_COM_S_DIVIDE_ATTACK`；真正效果完全位於 `BATTLE_DivideAttack()`。

### 第一階段：玩家 MP

原函式先以 `BATTLE_MultiList()` 取得敵方整側，第一輪只處理 `CHAR_TYPEPLAYER`：

`CHAR_MP = charmp - (charmp >> 1)`

也就是扣掉：

`floor(currentMP / 2)`

所以奇數值不是直接除成較小一半，例如：

- 100 → 50
- 25 → 13
- 1 → 1

因為 `1 >> 1 = 0`。

### 第二階段：HP

接著重新掃同一整側。

若 Battle Entry 沒有騎寵：

- 目前 HP >= 5：扣 `floor(currentHP/5)`
- 目前 HP < 5：固定扣 1

即一般情況為目前 HP 的 20%。

若該 Entry 是「玩家騎寵」：

- 玩家扣目前 HP 10%
- 騎寵也扣目前 HP 10%

但目前放置版的 Player slot 0 與 Active Pet slot 5 是兩個獨立 Battle Entry，沒有建立 `CHAR_RIDEPET` 騎乘關係。因此 V0.64 不能因為有 Active Pet 就擅自套騎寵分支；兩個 Entry 都依原碼落入「沒有騎寵」：

- Player 各自扣目前 HP 20%
- Active Pet 各自扣目前 HP 20%

低於 5 HP 時各自固定扣 1，因此此技能可以把 1 HP 目標直接降到 0。

### 不經一般戰鬥判定

`BATTLE_COM_S_DIVIDE_ATTACK` 直接呼叫 `BATTLE_DivideAttack()` 後結束，沒有：

- `BATTLE_AttackSeq`
- 命中／閃避
- Guard
- 屬性傷害
- `BATTLE_DamageWakeUp`
- 普通 Counter loop

V0.64 因此也不讓分身地裂喚醒睡眠或觸發反擊。

### Save schema

沒有新增持久化欄位，schema 維持 **18**。

### 正權重掃描更新

634 原正權重總和 5，V0.64 後已正式接入。

接入後剩餘正權重未處理技能：

- 676：AttackMagic → magic 204 FieldAttChange
- 688：AttackMagic → magic 435 MAGIC_Weaken
- 211：StealMoney
- 627／632／637／705：Combined → JYUJYUTU

仍維持「原 C 規則優先、不猜數值」。


## V0.65 Combined／綜合魔法

V0.65 接入目前正權重的四個 `PETSKILL_Combined`：

- 627 難得糊塗 → `综合法|6|21|139|159|169|179|189`
- 632 逆轉 → `综合法|1|240`
- 637 淨化之舞 → `综合法|1|61`
- 705 調和 → `综合法|1|230`

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/petskill2.txt`
- `gmsv/data/magic.txt`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_magic.c`
- `gmsv/src/magic/magic.c`
- `gmsv/src/item/item.c`
- `gmsv/src/char/char_data.c`
- `gmsv/src/char/defaultPlayer.h`

### Combined 的 magic 選擇

原 `PETSKILL_Combined()`：

1. 解析 `综合法|count|magic1|...`
2. 最多取 10 個 magic ID
3. 用 `kill[rand()%count]` 選一個
4. command 設為 `BATTLE_COM_JYUJYUTU`
5. `BATTLECOM3 low = magic ID`
6. **`BATTLECOM3 high = 0`**

battle.c 的 JYUJYUTU case 再呼叫：

`MAGIC_DirectUse(charaindex, magicId, toNo, 0)`

### item index 0 與 mp=-1

對非 Player 施術者，`MAGIC_DirectUse()` 直接把第四參數當成 global existing-item index，不經玩家背包轉換。

因此 Combined 固定查：

`ITEM_getInt(0, ITEM_MAGICUSEMP)`

原 existing-item allocator：

- static `Sindex = 1`
- 每次建立前先 `Sindex++`
- 正常從 index 2 開始
- wrap 後回 1
- **永遠不配置 index 0**

所以 `ITEM_CHECKINDEX(0)` 固定失敗，`ITEM_getInt()` 固定回 **-1**。

相關 MAGIC 函式的 MP 流程都是：

`if (CHAR_MP < mp) return FALSE;`
`CHAR_MP = CHAR_MP - mp;`

當 `mp=-1`：

- MP 不足判定必定通過
- Enemy MP 實際變成 `MP + 1`

### Enemy 初始 MP

`ENEMY_createEnemy()`：

- memset `CharNew`
- `CHAR_getDefaultChar(&CharNew,31010)`
- 後續沒有覆寫 `CHAR_MP / CHAR_MAXMP`

`CHAR_getDefaultChar()` 使用的 default player template 在 `defaultPlayer.h`：

- `CHAR_MP = 0`
- `CHAR_MAXMP = 0`

所以 V0.65 Enemy runtime 正式補：

- `mp = 0`
- `maxMp = 0`

Combined 每次成功進入 magic function 都可使 MP 從 0→1→2...；原碼這裡沒有 MaxMP clamp。

### 627 難得糊塗

隨機六選一：

- 21 恩惠的精靈 Lv2
- 139 毒霧的精靈 Lv5
- 159 石化精靈 Lv5
- 169 混亂精靈 Lv5
- 179 酒醉精靈 Lv5
- 189 睡眠精靈 Lv5

#### magic 21

magic.txt：

- function `MAGIC_Recovery`
- option `100`
- 範圍為對方整側

`BATTLE_MultiRecovery()` 對每個目標分別：

`RAND(100*0.9,100*1.1)`

也就是 90～110，再乘 `GetRecoveryRate()`：

- Player：`1 + VITAL * 0.00010`
- 非 Player：`1 + VITAL * 0.00005`

結果以 int 截斷，最後 cap MaxHP。

V0.65 使用目前 web 已有的原 raw VITAL 對 Player / Active Pet 各自計算，不把「100」誤做固定回血值。

#### magic 139／159／169／179／189

共同：

- turn 5
- Success 25
- `BATTLE_MultiStatusChange()`
- 每個對方存活目標各自跑 `BATTLE_StatusAttackCheck(...,25,30,1.0)`

V0.65 沿用既有正式 StatusAttackCheck port：

- 已有任何異常則不再套
- 等級差 ×1
- range ±30
- VITAL 比例抗性
- status resist
- 上限 80%
- 嚴格 `RAND(1,100) < per`

成功後狀態直接寫 **5**，不是 PetSkill StatusChange 路徑的 turn+1，因此使用 raw-turn storage。

### 637 淨化之舞

magic 61：

- 高等淨化精靈 Lv2
- `MAGIC_StatusRecovery`
- option `全`
- 我方整側

原 `BATTLE_MultiStatusRecovery()` 的「全」並不是清除所有後來新增的狀態。

條件明確限制：

`tostatus <= CHAR_WORKCONFUSION`

所以只涵蓋原基本六異常：

- 毒
- 麻痺
- 睡眠
- 石化
- 酒醉
- 混亂

V0.65 **不會**用 637 清除後來的劇毒、虛弱、魔障、沉默等狀態。

### 632 逆轉

magic 240：

- 彩虹的精靈
- `MAGIC_AttReverse`

`BATTLE_MultiAttReverse()` 先 XOR `CHAR_BATTLEFLG_REVERSE`，開啟時 `BATTLE_AttReverse()` 將 FIX 屬性：

- Earth ← Fire
- Water ← Wind
- Fire ← Earth
- Wind ← Water

即：

- 地 ↔ 火
- 水 ↔ 風

這是 battle-only work state，不修改角色原始屬性。

另外有一個重要時序：

- 第一次施放：flag OFF→ON，當下立即 swap
- 第二次施放：flag ON→OFF，`BATTLE_AttReverse()` 因 flag 已關而直接 return
- 所以**同一回合剩餘時間仍保持先前反轉的 FIX 值**
- 下一輪 `BATTLE_PreCommandSeq()` 先 `CHAR_complianceParameter()` 重建 base FIX，因 flag 已 OFF 才正式恢復

V0.65 新增 battle-only reverse flag + element work map，每輪開始重建，完整保留上述時序；不污染 save 內永久 `state.elements / pet.elements`。

### 705 調和

magic 230：

- 調和的精靈
- `MAGIC_FieldAttChange`
- option `无`

原 parser 得：

- field_att = NONE
- power 預設 30
- turn 預設 3

目前已接技能中仍沒有任何能成功把 field_att 改成非 NONE 的路徑；676 水的精靈仍受 dynamic existing-item index 的 MP cost 限制。

因此 V0.65 現有可達狀態下 705 是來源等價的：

`NONE → NONE`

仍記錄原 Power 30 / turn 3，但不虛構額外效果。

### Save schema

V0.65 新增的 Enemy MP、反轉 flag、FIX element work 都是單場 battle runtime，不持久化。

Save schema 維持 **18**。

### 剩餘正權重邊界

V0.65 後未接入正權重只剩：

- 676 → AttackMagic / magic 204 FieldAttChange
- 688 → AttackMagic / magic 435 MAGIC_Weaken
- 211 → StealMoney

676／688 的 PetSkill option 分別寫 `item 20900` / `item 20912`。對 Enemy 而言這不是 item ID，而是 **當下 ITEM_item[] existing index**；其內容取決於 server runtime 的全域物件配置，不能由靜態資料安全寫死 MP cost。

211 則在 `BATTLE_StealMoney()` 開頭直接讀 Enemy `CHAR_WORKPLAYERINDEX` 並要求 `CHAR_CHECKINDEX(masterindex)`。Enemy 建立流程沒有配置 owner，default work-int 為 0；而全域 char index 0 是否正好有效取決於原 server 當下角色配置，web 沒有等價全域 Char runtime。

因此這三項仍不能在「不猜 runtime」原則下硬接。


## V0.66 正權重 Enemy PetSkill runtime 邊界

V0.66 完成目前 Enemy AI 正權重 PetSkill 的靜態來源掃描收尾。

V0.65 後只剩：

- 211 捐獻／`PETSKILL_StealMoney`
- 676 E水的精靈／`PETSKILL_AttackMagic -> magic 204 item 20900`
- 688 E咒靈術／`PETSKILL_AttackMagic -> magic 435 item 20912`

這三個不是缺 petskill 資料、也不是函式未註冊；它們的 `PETSKILL_Use()` 本身都能成功建立 battle command。

真正無法由固定 source snapshot 唯一決定的是後續使用到的**原 server 全域 runtime index 狀態**。

### 211：CHAR_WORKPLAYERINDEX = 0 不是固定無效

`ENEMY_createEnemy()` 先經 `CHAR_getDefaultChar()`，所有 work-int 清為 0；後續 Enemy 建立流程沒有配置 `CHAR_WORKPLAYERINDEX`。

因此 211 進 `BATTLE_StealMoney()` 時：

`masterindex = 0`

接著原碼立刻：

`if (!CHAR_CHECKINDEX(masterindex)) return;`

V0.60 邊界原本還不能確定 char index 0 是否一定無效。V0.66 追到 `CHAR_initCharOneArray()` 後可確認：

- Player pool `startcnt = 0`
- 第一個 Player 就可以配置在 char index 0
- index 0 **不是保留位**

所以：

- 若原 server 當下有有效玩家佔住 char slot 0，211 可繼續執行。
- 若 slot 0 無有效玩家，211 直接 return。
- 這取決於原 server 當時全域在線角色／allocator 狀態，不能從 Enemy 靜態資料推導。

因此 web 不把自己的單機 Player 擅自視為原 server char index 0。

### 676／688：20900／20912 是 existing-item index，不是 item ID

兩筆 petskill option：

- 676：`magic 204 item 20900`
- 688：`magic 435 item 20912`

`MAGIC_DirectUse()` 對非 Player 施術者不做玩家背包 slot → existing index 轉換，而是直接：

`itemindex = itemnum`

所以實際查的是：

- `ITEM_item[20900]`
- `ITEM_item[20912]`

不是「道具 ID 20900／20912」。

`ITEM_item[]` 是原 server 的全域動態 existing-item pool。其 slot 是否正在使用、當下是哪一個 existing item，取決於：

- server 啟動後建立／銷毀物件的歷史
- NPC／Enemy／Player／掉落等所有 item allocation
- 當下 runtime occupancy

若 slot 無效，`ITEM_getInt()` 回 -1；若 slot 有效，則會讀**那個當下 existing item** 的 `ITEM_MAGICUSEMP`。

因此不能從 source repo 靜態斷言 20900／20912 的 MP cost。

### 為何 Combined 的 item 0 可以、676／688 不可以

V0.65 的 Combined 固定 itemnum=0 可以精確還原，是因為 ITEM allocator 已證明：

- static Sindex 初值 1
- 建立前先 ++
- 正常從 2 開始
- wrap 回 1
- **永遠不配置 index 0**

所以 index 0 固定 invalid → mp=-1。

相反地，20900／20912 位於正常 existing-item pool 範圍內，可能有效也可能無效，不能類推成固定 -1。

### V0.66 web 行為

新增：

`ENEMY_SOURCE_RUNTIME_BLOCKED_SKILL_IDS = {211,676,688}`

三者：

- 保留 Enemy AI 原正權重
- `PETSKILL_Use` 語意視為成功，因此仍正常跑該角色自身 StatusSeq
- battle action 時明確記錄是哪一個 runtime dependency 缺失
- 不套普通攻擊
- 不標成 source missing
- 不標成 unregistered function
- 不猜 MP cost
- 不把 web Player 假設成原 server char index 0

這比泛用「特殊寵技尚未接入」更精確，也避免未來掃描把它們誤當成漏做。

### V0.63 MP 回歸補正

V0.63 已讓手動「休息補滿」同時補滿 HP／MP，但戰敗自動回村仍只補 HP。

V0.66 補正：

- 戰敗自動回村：HP → MaxHP
- MP → MaxMP
- 日誌同步顯示「補滿 HP／MP」

不新增 save 欄位，schema 維持 **18**。

### 目前邊界結論

在「原 C 規則優先、不猜數值、不猜原 server 全域 allocator 狀態」標準下：

- 靜態可唯一還原的正權重 Enemy PetSkill 已接完。
- 剩餘 211／676／688 已正式分類為 **source runtime-dependent boundary**，不是一般未完成技能。

若下一階段要讓這三個也能完全模擬，就不是再補單一 PetSkill handler，而是要建立原 server 等價的：

- 全域 CHAR slot allocator／occupancy
- 全域 ITEM existing-item pool
- item create／destroy allocation history
- 對應 battle runtime ownership

在沒有這一層之前，硬指定任何結果都會違反「不猜 runtime」原則。


## V0.67 捐獻／StealMoney

V0.67 將正權重 PetSkill 211「捐獻」由 runtime-blocked 正式接入。

來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/char/char_base.c`
- `gmsv/src/include/version.h`

### 單機 CHAR runtime 對應

原 Enemy 建立後 `CHAR_WORKPLAYERINDEX` 保持 default 0。

原 `CHAR_initCharOneArray()` 的 Player pool：

- `startcnt = 0`
- 第一名 Player 可直接配置在 char index 0

本專案是單機單玩家 runtime，因此 V0.67 將唯一玩家明確對應成「空 server 的第一名 Player」＝ char slot 0。

這不是把 Enemy owner 改成玩家；只是讓原 `BATTLE_StealMoney()` 對 `masterindex=0` 的有效性檢查，在單機 runtime 有確定答案。

### Battle no. 映射與原 bug

`BATTLE_NewEntry()`：

- Player side = side 0
- Enemy side = side 1
- Enemy slot i 的 `bid = i + 10`

所以 web：

- `battleSlot 0 -> bid 10`
- `battleSlot 1 -> bid 11`
- 依此類推

`BATTLE_StealMoney()` 內有：

`if (attackNo > 10) safeSide = 1;`

因此 **bid 10 不會進入這個分支**。

對 Player target（defNo 0）：

- bid 10：被錯判為同側，`per = 0`
- bid 11～19：才走不同側偷錢機率

V0.67 保留這個來源 bug。

### 成功率

不同側 Player target：

`per = 50;`
`per = (((per + LV) / 4) + 10) >> 1;`

全部保持 C int 截斷。

實際成功條件：

`RAND(1,100) < per`

不是 `<=`。

### 偷取金額

成功命中 Player 後：

`GOLD = (int)(playerGold * RAND(1,15) * 0.01)`

也就是目前石幣的 1～15%。

此 build 已開 `_FIX_MAX_GOLD`：

`MaxGold = 1000000 + transmigration * 1800000`

目前 web 尚無轉生系統，單機角色對應初始轉生 0，因此 V0.67 的原服上限是：

**1,000,000**

原函式會在真正從 defender 扣錢前，先以 master slot 0 的 Gold 做上限 clamp。

單機 runtime 中 master slot 0 與唯一 Player 是同一角色，因此這個原本很怪的 clamp 也保留。

### Enemy 成功後

若攻擊者是 Pet：

- owner 得到 GOLD
- Pet 離場

但 Enemy 不是 Pet，因此成功後走：

`BATTLE_Exit(attackindex,battleindex)`

結果：

- Player 被扣石幣
- 沒有任何 owner 收到石幣
- 使用捐獻的 Enemy 直接離開戰鬥
- 該離場不視為擊殺，不給該 Enemy 的 EXP／掉落

若它是最後一名 Enemy，戰鬥因敵側無存活 Entry 而結束；web 同樣不產生擊殺獎勵。

### Pet target

原函式只對 Player / Enemy 明確設定 `per`。

Active Pet 作為目標時 `per` 保持 0，因此捐獻必定失敗，不會偷寵物、也不轉成普通攻擊。

### runtime-blocked 更新

V0.67：

- 211 → 已實作
- 676 → 仍 runtime-blocked
- 688 → 仍 runtime-blocked

676／688 接下來要由最小 ITEM existing-index runtime 解決。


## V0.68 ITEM existing-index runtime 與最後正權重 AttackMagic

V0.68 接入最後兩個 runtime-blocked 正權重 Enemy PetSkill：

- 676 E水的精靈 → `PETSKILL_AttackMagic` → `magic 204 item 20900`
- 688 E咒靈術 → `PETSKILL_AttackMagic` → `magic 435 item 20912`

來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/setup.cf`
- `gmsv/src/item/item.c`
- `gmsv/src/magic/magic.c`
- `gmsv/src/battle/battle_magic.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/data/magic.txt`

### 最小 ITEM_item[] runtime

原 `setup.cf`：

`itemnum=25000`

所以 20900／20912 都在合法 array 範圍。

但 `ITEM_CHECKINDEX()` 不只檢查範圍，也要求：

`ITEM_item[index].use == TRUE`

未配置的 existing slot：

- `ITEM_CHECKINDEX == FALSE`
- `ITEM_getInt(..., ITEM_MAGICUSEMP) == -1`

原 allocator `ITEM_initExistItemsOne()`：

- static `Sindex = 1`
- 每次搜尋前先 `Sindex++`
- 到 25000 時 wrap 到 1
- index 0 永不配置

V0.68 在 save 中新增最小：

`itemRuntime = { itemnum:25000, sindex:1, slots:{} }`

並提供 source-equivalent：

- existing slot MP lookup
- Sindex allocation
- free slot

目前不把舊 web inventory count map 反推成不存在的歷史 `ITEM_item[]` allocation。

V0.67 以前的 web 根本沒有 existing-item pool，因此 schema 18 → 19 migration 明確從**空 pool**開始；這比猜測過去 allocation history 更符合「不猜 runtime」原則。

### 676：magic 204 水的精靈 Lv5

magic.txt：

- ID 204
- `MAGIC_FieldAttChange`
- option：`水 100 turn 5`

Enemy 的 `MAGIC_DirectUse()`：

- itemnum 直接當 global existing index
- 目前新 runtime 中 20900 未配置
- `ITEM_getInt -> -1`
- MP 不足檢查：`0 < -1` 為 false
- `MP -= -1`
- Enemy MP 因此 +1

成功後 BattleArray：

- `field_att = WATER`
- `att_pow = 100`
- `att_count = 5`

V0.68 新增 battle-only field state。

原每個 battle round 結尾：

- 若 field_att != NONE，`att_count--`
- <=0 時回復 NONE

因此在施放當回合結尾就會由 5 → 4，時序照原 battle.c。

### 戰場屬性倍率

原 `BATTLE_FieldAttAdjust()`：

`0.5 + pAt(field) * att_pow * 0.01 * 0.01 * 0.5`

實際傷害再乘：

`AttackerFieldPower / DefenderFieldPower`

V0.68 已接到兩條來源路徑：

1. 一般物理屬性傷害
2. `_FIX_MAGICDAMAGE` AttackMagic

AttackMagic 特別保留原時序：

- 先由 MagicLv 將攻方四屬牽引到該魔法屬性
- **先以這個尚未乘 damage 的向量算 FieldAttAdjust**
- 再把向量乘魔法 power / damage
- 做四屬相剋
- 最後乘 field ratio

不是直接拿最終魔法傷害向量算 field power。

### 705 調和同步升級

V0.65 的 705 在當時沒有非 NONE field setter，所以只記錄來源資料。

V0.68 已有正式 field runtime 後：

- magic 230「調和的精靈」會真正把 field_att 改回 NONE
- 原 att_pow=30、att_count=3 仍記錄
- 但 battle.c 只有 `field_att != NONE` 才遞減 count，所以 NONE 本身不再 tick

因此現在 705 可以真正解除 676 建立的水戰場。

### 688：magic 435 癱瘓的精靈 Lv3

magic.txt：

- ID 435
- `MAGIC_Weaken`
- option：`虛 turn 7 成 50`
- 單體

同樣透過 item 20912 查 MP。

目前 slot 20912 未配置：

- MP cost = -1
- Enemy MP +1

之後 `MAGIC_ParamChange_Turn_Battle()`：

- status = WEAKEN
- turn = 7
- Success = 50
- Range = 30
- Bai = 1.0

逐目標呼叫：

`BATTLE_StatusAttackCheck(attacker,target,WEAKEN,50,30,1.0)`

成功後原碼：

`CHAR_WORKWEAKEN = turn + 1`

即寫入 8。

web 既有 weaken battle view 已依來源降低：

- attack 20%
- defense 20%
- quick 20%

V0.68 使用現有標準 StatusAttackCheck port，成功後以 7 作邏輯回合數、內部 storage 等價 8，保持原 StatusSeq 時序。

### Save schema 19

新增：

- `itemRuntime.itemnum`
- `itemRuntime.sindex`
- `itemRuntime.slots`

Battle field state 不持久化，因為原 BattleArray 也是單場 runtime；戰鬥結束／新戰鬥時回 NONE。

### 正權重 Enemy PetSkill 狀態

V0.68 後：

- 211 已於 V0.67 接入
- 676 已接入
- 688 已接入

原本 V0.66 的 runtime-blocked 集合現在為空。

後續正權重掃描應只剩三類：

- implemented
- source missing
- unregistered function

不再存在一般未分類或 runtime-blocked PetSkill。
## V0.69 Enemy ITEM existing-index allocator 生命週期

V0.69 把 V0.68 的最小 \`ITEM_item[]\` existing-index runtime 延伸到 Enemy 真正會建立與銷毀的物品生命週期。

來源固定為：

- \`gavinlinasd/StoneAge\`
- ref \`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56\`
- \`gmsv/setup.cf\`
- \`gmsv/src/item/item.c\`
- \`gmsv/src/char/enemy.c\`
- \`gmsv/src/char/char_base.c\`
- \`gmsv/src/char/pet.c\`
- \`gmsv/src/battle/battle.c\`

### Enemy 建立時的 existing item 配置

原 \`ENEMY_createEnemy()\` 在 \`CHAR_initCharOneArray()\` 成功之後，依固定順序：

1. 掃 \`ENEMY_ITEM1～10\`。
2. 對應 \`ITEMPROB1～10\` 以本 build 的 \`_FIX_ITEMPROB\`：
   \`RAND(0,999) < ITEMPROB\`。
3. 命中才呼叫 \`ITEM_makeItemAndRegist(itemId)\`。
4. 成功取得 existing index 後放入 Enemy 的 10 格 carried item。
5. 10 格全部處理完，才依 \`ENEMY_STYLE\` 建立 \`CHAR_ARM\` 武器。
6. STYLE 武器建立完成後才進 \`ENEMY_RandomChange()\`。

STYLE 對應完全照原 C：

- 1 → Item 0
- 2 → Item 100
- 3 → Item 200
- 4 → Item 400
- 5 → Item 500
- 6 → Item 700
- 7 → Item 600

web 的 V0.69 同樣讓 carried loot 先走 existing allocator，再建立 STYLE 武器；若 \`ITEM_makeItemAndRegist\` 等價配置失敗，該物品不會被留下成不存在的 carried item。

### existing slot ownership

schema 20 起，每個 runtime slot 除原本的：

- \`use\`
- \`itemId\`
- \`magicUseMp\`

再記錄：

- \`owner\`
- \`source\`
- \`enemySlot\`

Enemy 建立出的 carried item 使用：

\`owner = enemy:<unit id>\`

STYLE 武器也屬於同一 Enemy。

這些欄位只用來讓 web 能安全重現 source 中「哪個 CHAR 持有哪個 existing index」的生命週期，不把舊存檔反推成不存在的歷史配置。

### 戰利品：Enemy carried item → Battle getitem

原 \`BATTLE_AddExpItem()\` 只掃 Enemy 的 10 格 carried item，不會把 \`CHAR_ARM\` 的 STYLE 武器當戰利品。

對戰敗 Enemy：

1. carried item 先從 Enemy item slot 拔掉。
2. existing item 本身不重新建立，原 index 直接進 Player 的 \`BATTLE_ENTRY.getitem[]\`。
3. 每名 Player 的 \`GETITEM_MAX = 3\`。
4. 前 3 個直接放入空 getitem。
5. 已滿後，每個新物品先 \`RAND(0,1)\`：
   - 成功：\`RAND(0,2)\` 隨機替換舊 getitem，舊 existing item 立即釋放。
   - 失敗：新 incoming existing item 立即釋放。

目前是單機單 Player，所以 V0.69 以一組 3 格 getitem 完整保留這段替換規則。

結果畫面結算時，若 getitem 成功進入 web 玩家背包，仍保留**同一個 existing index**，只把 owner 改成 Player；不是銷毀後再建立另一份。

### Enemy 離場與 slot 釋放

原 \`BATTLE_Exit()\` 對 \`CHAR_TYPEENEMY\` 會呼叫：

\`CHAR_endCharOneArray()\`

而 \`CHAR_endCharData()\` 會逐格 \`ITEM_endExistItemsOne()\`，所以 Enemy 身上仍留著的：

- 未進 getitem 的 carried item
- STYLE 武器

都必須釋放。

V0.69 已接到下列路徑：

- Enemy 正常被擊敗後的戰鬥結算
- Enemy 逃跑
- Enemy 技能／特殊流程直接離場
- 玩家戰敗
- 玩家被強制退出戰鬥
- 切換地圖／Encounter／任務戰區時的無獎勵清場
- 捕獲成功
- 戰鬥結束

無獎勵結束目前統一經 \`clearEnemyBattleNoReward()\`，同時：

- 釋放仍由 Enemy 持有的 existing slots
- 清空 Enemy battle object
- 清除 battle-only status / reverse / element work / field state

### 捕獲

原 \`PET_createPetFromCharaIndex()\` 會從 Enemy 複製角色／寵物能力與 PetSkill，但沒有把 Enemy 的 item slots 複製進新 Pet。

因此捕獲後 Enemy 原 carried item 與 STYLE 武器仍走 Enemy 離場清理，不會跟著變成寵物物品。

V0.69 回歸時另外修正一個靜態 formation 邊界：

- 捕獲其中一隻後，該類 formation 的現有遊戲流程會直接結束整場。
- 舊碼只釋放被捕獲 target，其他 formation 成員的 existing slots 可能留在 pool。
- 現在改為整場走 \`clearEnemyBattleNoReward()\`，其餘 Enemy 一併做 \`CHAR_endCharOneArray\` 等價清理。

動態群戰只移除被捕獲的那一隻；若它是最後一隻，同樣走統一清場。

### 玩家取得後再消耗

從 battle getitem 取得的物品會保持 tracked existing index。

玩家後續真的消耗到這類 tracked item 時，V0.69 才釋放其 existing slot；舊版／任務直接 \`giveItem()\` 產生、沒有可證明 existing-index 歷史的數量仍視為 untracked，優先消耗 untracked，避免替舊資料虛構 allocation。

### \`ITEM_MAGICUSEMP\`：未知值仍然不猜

V0.69 不把舊編碼 \`itemset6.txt\` 無法精確還原的 \`ITEM_MAGICUSEMP\` 填成 0 或其他猜測值。

runtime 規則維持：

- slot invalid / 未配置 → 原 \`ITEM_getInt()\` 等價回 \`-1\`
- slot valid 且 \`magicUseMp\` 已有可靠值 → 使用該值
- slot valid，但該 item 的 \`ITEM_MAGICUSEMP\` 無法可靠解碼 → runtime 記為 \`null\`

676／688 若剛好查到一個 valid、但 \`magicUseMp = null\` 的 20900／20912 slot：

- 不猜 MP cost
- 不扣／加 MP
- 不套 magic 204／435 的效果
- 日誌明確標記 source item MP unknown

這樣可以讓 allocator occupancy 真正影響 676／688，又不破壞「原 C 規則優先、不猜數值」。

### Save schema 20

V0.69：

- schema 19 → **20**
- V0.68 以前仍從空 existing pool migration
- V0.68 已存在但沒有 ownership 的 slot 保留其 \`use/index/itemId/magicUseMp\`
- 不替舊 slot 猜 owner

### V0.69 回歸結果

完成生命週期後重新檢查：

- \`game.js\` JavaScript 語法：通過
- Enemy 10 格 carried item：接入 existing allocator
- 2958 Enemy STYLE：接入 STYLE weapon allocation
- getitem 3 格轉移／替換／釋放：接入
- Enemy 逃跑／直接離場：釋放
- 玩家戰敗／強制離場：釋放
- 捕獲：釋放；靜態 formation 額外殘留已修
- 無獎勵戰鬥清場：統一入口
- 戰鬥勝利：保留轉給 Player 的 existing index，只清 Enemy 尚持有項目
- \`ITEM_MAGICUSEMP\` source-unknown：維持 unknown，不猜

V0.69 至此把 Enemy carried loot + STYLE 武器的 existing-index allocator 生命週期接成可持續影響 20900／20912 occupancy 的 runtime。


## V0.70 itemset6 ITEM_MAGICUSEMP runtime

V0.70 把 V0.68／V0.69 最後保留的 `ITEM_MAGICUSEMP = unknown` 邊界正式解開，讓 Enemy 建立出的 existing item 能帶入原 `itemset6.txt` 的真實 MP cost。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/itemset6.txt`
- `gmsv/src/item/item.c`
- `gmsv/src/include/item.h`
- `gmsv/src/include/version.h`
- `gmsv/data/enemy1.txt`
- `gmsv/src/char/enemy.c`

### itemset6 欄位已由原 C parser 對齊

這個 build 同時開啟 `_ITEMSET2_ITEM`、`_ITEM_INSLAY`、`_Item_ReLifeAct`、`_ITEM_MAXUSERNUM`、`_ITEMSET4_TXT`、`_TAKE_ITEMDAMAGE`、`_ADD_DEAMGEDEFC`、`_SUIT_ITEM`、`_ITEMSET5_TXT`、`_ITEMSET6_TXT` 等相關欄位。

依 `ITEM_itemconfentries[]` 與 `ITEM_readItemConfFile()`：

- 每筆有效 `itemset6.txt` 資料固定 94 欄。
- `ITEM_ID_TOKEN_INDEX = 17`。
- `ITEM_MAGICID` = 第 56 欄。
- `ITEM_MAGICPROB` = 第 57 欄。
- `ITEM_MAGICUSEMP` = 第 **58 欄**。
- 空的 `magicusemp` 欄不是 unknown；`ITEM_getDefaultItemSetting()` 先給預設值 0，只有 token 非空才用 `atoi()` 覆寫，所以空欄正式等價 **0**。

完整來源掃描：

- 10,737 筆有效 Item。
- 10,737 個唯一 Item ID，無 duplicate。
- Item ID 範圍 0～23009。
- 228 筆 `magicusemp` token 為空，依原 parser 為 0。
- 5,082 筆 `ITEM_MAGICUSEMP` 非 0。
- 非負 MP cost 整體範圍 0～100。

產物：

`data/generated/stoneage_item_magic_runtime.json`

內含來源 ref／blob、parser token 定義、統計與完整 `itemId -> magicUseMp` 對照。

### ITEM_makeItemAndRegist 的 MP cost 可以安全由模板回填

原 `ITEM_makeItem()`：

1. 從 `ITEM_tbl[itemId]` 複製完整 `ITEM_Item`。
2. **V1.72 更正：**固定迴圈全部 66 個 `ITEM_DATAINT`，逐欄做 `RAND(0, randomdata[i])`；`randomwidth = 0` 仍會實際消耗一顆 `rand()`，只是結果必為 0。
3. `ITEM_MAGICUSEMP` 在 parser 中是普通 `ITEM_INTENTRY`，不是 `ITEM_INTFUNC / ITEM_getRandomValue`，所以其 random width 為 0。
4. `ITEM_makeItemAndRegist()` 再把這份 Item 丟進 existing-index allocator。

全 source 搜描也沒有找到普通 Enemy `ITEM_makeItemAndRegist()` 建立路徑會在 init 時重新隨機改寫 `ITEM_MAGICUSEMP`；找到的 `ITEM_setInt(... ITEM_MAGICUSEMP ...)` 是鑲嵌／合成時把既有 Item 的 MP 值複製到另一件 Item，不屬於 Enemy carried loot／STYLE 的建立流程。

因此 V0.70 可以由 Item ID 唯一回填 Enemy 新建 existing item 的 MP cost，不需要猜值。

### existing allocator 接入

新增：

- `ITEM_MAGIC_RUNTIME_URL`
- `itemMagicDb`
- `sourceItemTemplateExists(itemId)`
- `sourceItemTemplateMagicUseMp(itemId)`

`sourceItemRuntimeAlloc()` 現在：

- 先驗證 Item ID 是否真的存在於原 `ITEM_tbl` 對應資料。
- 不存在 → 等價原 `ITEM_makeItem()` 失敗，return -1。
- 存在 → 若呼叫端沒有另外提供可靠 MP 值，就從原 `itemset6` runtime 取得真實 `ITEM_MAGICUSEMP`。
- existing slot 仍保留原 V0.69 的 `itemId / owner / source / enemySlot` 生命週期。

因此 Enemy 的：

- 10 格 carried loot
- STYLE 武器

都不再把 `magicUseMp` 寫成 null，而是建立當下直接帶入正式來源值。

### 676／688 的 runtime 現在有四種精確結果

676：

- `magic 204 item 20900`

688：

- `magic 435 item 20912`

這裡的 20900／20912 仍是 **global existing index**，不是 Item ID。

`MAGIC_DirectUse()` 等價流程現在可以區分：

1. existing slot 未配置：
   - `ITEM_getInt -> -1`
   - Enemy `MP < -1` 為 false
   - `MP -= -1`
   - Enemy MP +1
   - 魔法繼續執行

2. slot 已配置，該 Item `MAGICUSEMP = 0`：
   - 不改 MP
   - 魔法正常執行

3. slot 已配置，`MAGICUSEMP > 0` 且 Enemy MP 不足：
   - 原 `MAGIC_DirectUse()` 失敗
   - 不扣 MP
   - 不套魔法效果

4. slot 已配置，`MAGICUSEMP > 0` 且 MP 足夠：
   - 扣除正式 MP cost
   - 再執行 magic 204／435

若 legacy slot 連可唯一辨識的 Item ID 都沒有，仍維持 unknown／不猜效果；這是資料真的不足，不再是 itemset6 無法解碼。

### Enemy 掉落表與缺失 Item template

直接用同一 fixed ref 的 `enemy1.txt` 重新掃 2958 筆 Enemy：

- 正掉落機率欄：1,447 格。
- 掉落＋STYLE 共引用 470 種 Item ID。
- 有 52 種被 `enemy1.txt` 引用的 Item ID 在 `itemset6.txt` 根本不存在。
- 這 52 種缺失 ID 共出現在 115 個正機率掉落格。

原 C 對這些資料會：

`ITEM_CHECKITEMTABLE == FALSE -> ITEM_makeItem() FALSE -> ITEM_makeItemAndRegist() = -1`

所以 V0.70 同樣不建立該 carried item；不再像 V0.69 因缺少 Item template 表而可能暫時產生 phantom existing item。

目前 Enemy 實際引用且 `MAGICUSEMP > 0` 的來源 Item 至少包含：

- 2165 → 20
- 2329 → 16
- 21048 → 24
- 21170 → 10
- 21171 → 10
- 21172 → 10
- 21173 → 20

因此 676／688 的 existing-index occupancy 現在確實會被 Enemy allocation history 帶入非零 MP cost，不只是理論上的資料欄位。

### Save schema 21

V0.70：

- schema 20 → **21**
- V0.69 已存在、`itemId` 可由 source 唯一識別且 `magicUseMp = null` 的 slot，自動由第 58 欄回填。
- 若 V0.69 曾建立出原 `itemset6` 不存在的 phantom Item slot，migration 會移除。
- 若該 phantom 已是 `owner=player / source=battle-getitem`，只從 inventory 扣掉這一份 tracked 數量；不碰任務／舊版 `giveItem()` 產生的 untracked 同 ID 道具。

### V0.70 回歸結果

- `stoneage_item_magic_runtime.json`：10,737 個唯一 Item ID。
- 所有資料列 94 欄規格驗證完成。
- 空 `magicusemp` token 的 C default=0 已保留。
- Enemy missing Item template 的 source failure 已保留。
- Enemy carried loot／STYLE allocation 已改為真實 MP cost。
- 676／688 原 existing-index 語意未改成 Item ID 查詢。
- `game.js` JavaScript 語法解析：通過。

V0.70 至此把 V0.68／V0.69 的 ITEM existing-index allocator 從「只知道 occupancy／ownership」推進成「existing item 同時帶有原 itemset6 的正式 MAGICUSEMP 資料」，讓 allocator history 可以真正改變 676／688 的施法結果。


## V0.71 Enemy 武器 runtime / compliance

V0.71 把 V0.69 已建立的 Enemy STYLE existing item 從「只追蹤 ownership／生命週期」推進成原 `CHAR_complianceParameter()` 會真正讀取的戰鬥裝備。

來源固定為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/data/itemset6.txt`
- `gmsv/src/char/enemy.c`
- `gmsv/src/char/char.c`
- `gmsv/src/item/item.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_ai.c`

新增：

`data/generated/stoneage_enemy_weapon_runtime.json`

### STYLE 武器與 itemset6

原 `ENEMY_createEnemy()`：

1. 建立 Enemy Char。
2. 先建立 10 格 carried item。
3. 依 `ENEMY_STYLE` 建立 `CHAR_ARM` 武器。
4. 呼叫 `ENEMY_RandomChange()`。
5. 最後才呼叫 `CHAR_complianceParameter()`。

STYLE 對應仍為：

- 1 → Item 0 小斧頭
- 2 → Item 100 小棍棒
- 3 → Item 200 小的槍
- 4 → Item 400 小的弓箭
- 5 → Item 500 小的回旋標
- 6 → Item 700 小的石
- 7 → Item 600 小的投擲斧頭

目前 2958 筆 Enemy 中：

- STYLE=0：2899
- STYLE=1：7
- STYLE=2：12
- STYLE=3：4
- STYLE=4：11
- STYLE=5：8
- STYLE=6：5
- STYLE=7：12

也就是 **59 隻 Enemy 的 STYLE 武器會實際改變戰鬥能力**。

### 八個 Enemy 自動武器模板

除七種 STYLE 武器外，`ENEMY_RandomChange()` 人形分支還會用：

- Item 2498「敵人專用弓箭」

V0.71 runtime 共保存 8 個原 itemset6 模板。

和目前 battle 直接相關的來源值：

| Item | 名稱 | Type | 攻 | 防 | 敏 | Critical | AttackNum |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 0 | 小斧頭 | AXE | +9 | -3 | -3 | 0 | 1～1 |
| 100 | 小棍棒 | CLUB | +4 | 0 | 0 | +1 | 1～1 |
| 200 | 小的槍 | SPEAR | +5 | 0 | -1 | +1 | 0～0 |
| 400 | 小的弓箭 | BOW | +2 | -1 | 0 | 0 | 1～3 |
| 500 | 小的回旋標 | BOOMERANG | +3 | 0 | 0 | 0 | 1～1 |
| 600 | 小的投擲斧頭 | BOUNDTHROW | +4 | 0 | 0 | +3 | 1～1 |
| 700 | 小的石 | BREAKTHROW | +3 | -1 | 0 | 0 | 1～1 |
| 2498 | 敵人專用弓箭 | BOW | 0 | 0 | 0 | 0 | 3～5 |

這批會進 `ITEM_equipEffect()` 的裝備 modifier pair 全部都是 min=max，所以 V0.71 可以精確套值，不需要自行增加建立道具時的猜測 RNG。

### CHAR compliance

原：

`CHAR_complianceParameter()`

先：

`CHAR_initcharWorkInt()`

建立裸：

- WORKFIXSTR
- WORKFIXTOUGH
- WORKFIXDEX
- WORKMAXHP / WORKMAXMP

再：

`ITEM_equipEffect()`

把裝備 modifier 加進 work 值。

V0.71 新增：

- `sourceEnemyWeaponTemplate()`
- `sourceEnemyWeaponCompliance()`

Enemy 最終：

- attack += weapon modifyAttack，最低 0
- defense += weapon modifyDefense，最低 -100
- quick += weapon modifyQuick，最低 -100
- maxHp / maxMp 同樣保留 equip-effect clamp
- weapon critical、type、attackNum 另保存於 Enemy battle runtime

所以例如 STYLE 1 的小斧頭不再只是 existing item：

- 攻 +9
- 防 -3
- 敏 -3

都會真正改變 Enemy 戰鬥值與出手排序。

### RandomChange 人形換武器

原 `ENEMY_RandomChange()` 的人形 Enemy 範圍：

- 564～580
- 739～750
- 895～906

目前資料共 41 隻。

它會呼叫：

`DoujyouRandomWeponSet()`

原流程不是覆蓋一個武器 ID 而已：

1. 先讀目前 `CHAR_ARM`。
2. 若 existing index 有效，先 `ITEM_endExistItemsOne()`。
3. 抽九種：
   - none
   - FIST
   - AXE
   - CLUB
   - SPEAR
   - BOW
   - BOOMERANG
   - BOUNDTHROW
   - BREAKTHROW
4. 有實體武器才再 `ITEM_makeItemAndRegist()`。
5. 新 existing index 寫回 `CHAR_ARM`。

V0.71 現在同樣：

- 先釋放原 STYLE existing slot
- 再配置新的 `enemy-dojo-weapon`
- `releaseEnemyRuntimeItems()` 同時認得最終 `weaponItemIndex`
- 不會因 RandomChange 換武器而漏 existing slot

特別注意原道場 BOW：

**BOW → Item 2498**

不是 STYLE 的 Item 400。

none／FIST 不建立新 Item；來源會留下已失效的舊 ARM index，之後 `ITEM_CHECKINDEX` 失敗，戰鬥上等價空手。web 以無有效 weapon slot 表示同一語意。

目前這 41 隻人形 RandomChange 剛好 STYLE 全為 0，但仍完整保留上述流程，避免未來資料變更後行為錯誤。

寵物型 RandomChange：

- 655～720
- 859～894
- 907～940

目前共 136 隻，只換技能、不換武器；V0.71 同樣保留。

### 武器 Critical

原 `BATTLE_CriticalCheck()` 對 Player / Pet / Enemy 最後都實際呼叫同一個：

`BATTLE_CriticalCheckPlayer()`

它會直接從 `CHAR_ARM` existing item 讀：

`ITEM_CRITICAL`

公式中的裝備值：

`At_Soubi * 0.5`

是在乘 `wari` **之前**加入。

V0.71 的 `battleCriticalChance()` 已補上這個順序。

因此：

- CLUB +1
- SPEAR +1
- BOUNDTHROW +3

都會真正影響 Enemy 會心率。

### 弓的會心傷害例外

原 `BATTLE_AttackSeq()` 即使弓箭通過 Critical 判定，若：

`gWeponType == ITEM_BOW`

不呼叫 `BATTLE_CriDamageCalc()`，而只走普通：

`BATTLE_DamageCalc()`

因此弓仍可帶 critical flag，但**不取得一般會心的額外防禦補傷**。

V0.71 已保留此例外。

### 投射武器禁止反擊

原 `BATTLE_IsThrowWepon()`：

- BOW
- BOOMERANG
- BREAKTHROW
- BOUNDTHROW

皆為 TRUE。

`BATTLE_CounterCheckPlayer()` 與 `BATTLE_CounterCheckPet()` 都先檢查：

- 反擊者是否拿投射武器
- 被反擊者是否拿投射武器

任一成立直接 return FALSE。

V0.71 的 counter path 現在同樣在最前面阻擋，因此 Enemy 拿弓／回力標／投斧／石頭時，不再錯誤觸發玩家或寵物的近身反擊鏈。

### CounterTbl 與原 SPEAR bug

Player 反擊使用：

`CriPer * CounterTbl * 0.1 + Luck`

V0.71 正式接回原 `CounterTbl`。

因此先前 web 註解假設的「FIST vs FIST = 10」並不正確；原：

- FIST → `BATTLE_C_CLAW`
- FIST vs FIST 的表值實際是 **9**

另外原 `BATTLE_ItemType2ItemMap()` 明確有：

- FIST
- AXE
- CLUB
- BOW
- BOOMERANG / BOUNDTHROW / BREAKTHROW

卻**漏掉 SPEAR**。

因此 SPEAR 會保持預設：

`BATTLE_C_NONE = 0`

V0.71 故意保留這個來源 bug，不自行幫原 C 修正。

Enemy / Pet 作為反擊者走 `BATTLE_CounterCheckPet()`，來源本來就不使用 CounterTbl；web 沒有錯套 Player 表。

### 捕獲不繼承 Enemy 武器

原 `PET_createPetFromCharaIndex()` 會複製 Enemy 的角色能力／技能等，但不複製 item slots。

因此被捕獲 Enemy 的 STYLE／道場武器不能變成新 Pet 的永久能力。

V0.71：

- Enemy 戰鬥時使用完成 equip compliance 的 attack / defense / quick
- 捕獲時 `serverCombat` 明確取 `serverDerived` 裸能力
- Pet 後續 `petBattleView()` 也會由 `serverStats` 重算裸 combat
- Enemy 武器 existing item 照原離場流程釋放

同時修正捕獲率中的 Enemy DEX：

原 `BATTLE_CaptureCheck()` 使用：

`CHAR_WORKFIXDEX`

所以 V0.71 改用已完成 compliance 的 `target.quick`，STYLE／道場武器的敏捷修正會正確進捕獲公式；不是再使用未縮放的 raw template DEX。

### ma / B_AI_MAGICMODE 的來源 C_WAIT

V0.71 追查另一個舊邊界：

`BATTLE_ai_normal()` 會讀：

`ma`

並把 `B_AI_MAGICMODE` 納入權重抽籤。

但來源函式後半只有：

- ATTACK
- GUARD
- ESCAPE
- WAZA

沒有任何 `B_AI_MAGICMODE` case。

所以若抽中 magic：

- 函式一路落到 `return FALSE`
- `BATTLE_ai_all()` 不把角色設成 C_OK
- Enemy 保持 C_WAIT
- 本回合連自己的 StatusSeq 都不執行

V0.71 已把舊的「magic effect 未配置，所以空過」改成正式 source C_WAIT。

目前 `stoneage_enemy_ai.json` 2958 隻 Enemy 的 `m > 0` 數量為 **0**，所以此 bug 在目前資料不可達；保留這個 handler 是為了未來 source 資料若出現 ma 時仍不偏離原 C。

### Save schema

V0.71 **不升 schema**，仍為 **21**。

原因：

- weapon template 是靜態 generated runtime
- Enemy unit / equipped weapon 是單場 battle runtime
- existing item ownership 仍沿用 schema 21 的 `itemRuntime`
- 沒有新增需持久化的玩家欄位

### 尚未在 V0.71 展開的 weapon command

V0.71 已接「裝備與 compliance」，但沒有把所有武器 command 一次混進來。

原 `BATTLE_GetAttackCount()` 與 battle command 還包含：

- BOW 的 AttackNum 多段／多 target 流程
- Item 2498 的 3～5 次弓攻擊
- STYLE Item 400 的 1～3 次弓攻擊
- BOOMERANG 將普通 ATTACK 改成 `BATTLE_COM_BOOMERANG`
- BREAKTHROW 的麻痺附加狀態
- 遠距武器的完整 target list / command 細節

這些屬於下一層「weapon battle command」，V0.71 不用單體普通攻擊硬冒充完整弓／回力標流程。

### V0.71 回歸

目前確認：

- `game.js` 完整 JavaScript 語法解析：PASS
- 8 個 Enemy 自動武器模板：全部存在
- equip modifier pair：全部 deterministic
- STYLE mapping：改由 runtime data 驅動
- RandomChange：在 STYLE allocation 之後
- human RandomChange：舊 ARM existing slot 先 free，再建 dojo weapon
- dojo BOW：Item 2498
- Enemy 結束：final weapon slot 可釋放
- 攻／防／敏 compliance：接入
- ITEM_CRITICAL：接入
- BOW critical damage 例外：接入
- throw weapon counter block：接入
- CounterTbl：接入，SPEAR 原 mapping bug 保留
- 捕獲：不繼承裝備，FIXDEX 使用 final compliance 值
- ma：source C_WAIT
- schema：維持 21

V0.71 至此把 Enemy STYLE 從「存在一把 item」推進成「原 C 真正會影響 WORKFIX 與物理戰鬥判定的裝備」。

下一個最直接的來源缺口是 **BATTLE_GetAttackCount + BOW / BOOMERANG / BREAKTHROW weapon command**。


## V0.72 BATTLE_GetAttackCount / weapon battle command

V0.72 延續 V0.71 的 Enemy existing-item／CHAR compliance，開始把 `CHAR_ARM` 真正帶進原 battle command。

來源仍固定：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/data/itemset6.txt`

### BATTLE_GetAttackCount

原：

`BATTLE_GetAttackCount(charaindex)`

規則：

1. `CHAR_ARM` existing index 無效 → 回傳 0。
2. existing item 有效 → `RAND(ITEM_ATTACKNUM_MIN, ITEM_ATTACKNUM_MAX)`。
3. 抽出值 <= 0 → 強制改為 1。
4. battle 主流程若收到 0，而角色不是 Player → `attack_max = 1`。

因此 Enemy 的正式結果：

- Item 400 小的弓箭：**1～3**
- Item 2498 敵人專用弓箭：**3～5**
- Item 200 小的槍雖然資料是 0～0，但因有效 existing item，最後仍為 **1**
- 空手／無有效 ARM 的 Enemy：**1**

V0.72 新增 `sourceBattleGetAttackCount()` 與 Enemy non-player fallback；每次出手都從目前有效 `weaponItemIndex` 查 existing slot，再讀 weapon template，不把 AttackNum 固定寫死成某個 Enemy 常數。

### BOW：aBowW / target list

原 `BATTLE_TargetListSet()` 的弓不是「對同一隻重複射 N 次」。

固定 `aBowW[50]`：

```text
0 2 1 4 3 | 0 1 2 3 4
1 0 3 2 4 | 1 3 0 2 4
2 4 0 1 3 | 2 0 4 1 3
3 1 0 2 4 | 3 1 0 2 4
4 2 0 1 3 | 4 2 0 1 3
```

會依：

- 原始 `defNo % 5`
- 一次 `RAND(0,1)`
- 前／後列對應位置

展開最多 10 個候選 battle slot。

原攻擊 loop 只有在候選 slot 仍存活、真的呼叫 `BATTLE_Attack()` 後才：

`++attack_count`

所以：

- 空格不消耗發數
- 已死亡目標不消耗發數
- 同一份 bow target list 不會為了湊滿 AttackNum 無限重複同一格
- 若場上存活候選數少於抽到的 AttackNum，實際攻擊次數可以少於 AttackNum

單機目前仍維持既有 battle slot：

- Player = 0
- Active Pet = 5
- Enemy = 10 + `battleSlot`

因此弓會照原 target list 在玩家／出戰寵物的實際 slot 間尋找可攻擊目標，而不是把 Item 2498 的 3～5 發硬灌到同一個角色。

遠距 command metadata 同原：

- BOW → `BB ... w0`

### BOOMERANG

原普通：

`BATTLE_COM_ATTACK`

若 `gWeponType == ITEM_BOOMERANG`，先改成：

`BATTLE_COM_BOOMERANG`

V0.72 保留這個邊界：只有普通 ATTACK 轉換；其他直接攻擊 PetSkill 不會因拿回力標而提前誤轉 command。

原 `BoomerangVsTbl`：

```text
4  2  0  1  3
9  7  5  6  8
14 12 10 11 13
19 17 15 16 18
```

並固定：

`gBattleDamageModyfy = 0.3`

Enemy 位於 side 1，原 loop 使用：

- `k = 4`
- `j = -1`

所以 V0.72 同樣反向掃該 5-slot row，對每個仍存活的 slot 各做一次 30% 物理傷害。

command metadata：

- BOOMERANG → `BO`

### BOUNDTHROW / BREAKTHROW

原普通物理流程的遠距 command：

- BOUNDTHROW → `BB ... w1`
- BREAKTHROW → `BB ... w2`

Item 600、700 的 AttackNum 都是 1～1，所以目前各為一擊；仍由同一 `BATTLE_GetAttackCount` 路徑取得，不另外猜固定次數。

四種遠距武器：

- BOW
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW

在 V0.71 已依 `BATTLE_IsThrowWepon()` 阻擋近身反擊；V0.72 延續此規則。

### BREAKTHROW 麻痺

原 battle turn 在判定武器型別後直接設定：

```c
gBattleStausChange = BATTLE_ST_PARALYSIS;
gBattleStausTurn = 0;
```

真正套狀態是在 `BATTLE_Attack()` 造成：

`damage > 0`

之後。

原 `BATTLE_StatusAttackCheck()` 對麻痺的特殊分支不是一般等級／VITAL 公式，而是：

`per = 20 - paralysis resistance`

成功條件仍是：

`RAND(1,100) < per`

且目標若已有任何 StatusTbl 異常，直接失敗。

成功後：

`gBattleStausTurn + 1 = 1`

所以投石造成正傷害後會嘗試套 **1 回合麻痺**。

V0.72 直接復用現有 `battleStatusChance(..., 'paralysis')` 與 `battleStatusApply(..., 0)`，沒有另外發明麻痺機率。

### V0.72 回歸

確認：

- `game.js` 完整 JavaScript 語法解析：PASS
- Item 400 AttackNum：1～3
- Item 2498 AttackNum：3～5
- Item 500 Type：BOOMERANG 17
- Item 600 Type：BOUNDTHROW 18
- Item 700 Type：BREAKTHROW 19
- `aBowW` Player slot 0 的兩組候選序列：
  - RAND 0 → `0,5,2,7,1,6,4,9,3,8`
  - RAND 1 → `0,5,1,6,2,7,3,8,4,9`
- `aBowW` Pet slot 5 的兩組候選序列：
  - RAND 0 → `5,0,7,2,6,1,9,4,8,3`
  - RAND 1 → `5,0,6,1,7,2,8,3,9,4`
- BOOMERANG：Enemy side 反向 5-slot traversal + 0.3 damage multiplier
- BOUNDTHROW：w1 投擲流程
- BREAKTHROW：w2 + 正傷害後原麻痺檢定
- throw weapon counter block：仍生效
- schema：仍為 21

V0.72 至此把 V0.71 已存在的 Enemy 武器，從「會影響能力／會心／反擊資格」推進成「真正依原 C 的 AttackNum、遠距 target list 與 weapon command 執行」。



