# First-route encounter target index

更新日期：2026-09-30

本索引把 fixed-C encount.txt + group1.txt 的 floor 100 / 200 encounter rectangles 收斂成可供路徑驗證的 source-coordinate targets。

固定 source：
- gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- gmsv/data/encount.txt blob 89da97a15ea866a36f26ec3bb7ab5490f3eccc5f
- gmsv/data/group1.txt blob 1be75eb3e56ab16d4b433146ec59538ad651c874

## 目前結果

### Floor 100

共 46 rows：32 unconditional、1 mixed、1 conditional_item、11 unresolved_group、1 placeholder。

最接近 four-town incoming landings 的 unconditional rectangles：
- Encounter 28：11,567 → 155,707，distance 0，Group 104/107/110/113。
- Encounter 64：11,524 → 208,708，distance 0，Group 105/108/111/114/116。
- Encounter 65：568,538 → 610,578，distance 71，Group 89/92/94。
- Encounter 57：633,329 → 662,403，distance 88，Group 169/170。

11 個 unresolved rows 必須維持 non-promoted；固定 source 已知缺失 group 包含 791、792、793、794、1230、1315、1316。

### Floor 200

共 114 rows：103 unconditional、5 mixed、1 conditional_item、5 unresolved_group。

與 incoming portal landing 重疊或非常接近的 source rectangles：
- Encounter 88：516,238 → 772,452，與 3000→200 landing area 有直接重疊，但為 mixed。
- Encounter 95：262,565 → 333,686，與 4000→200 landing area 有直接重疊，為 unconditional。
- Encounter 196：561,402 → 623,409，distance 23，unconditional，Group 310/311/312/313。
- Encounter 197：582,392 → 591,404，distance 25，unconditional。
- Encounter 192：548,400 → 565,480，distance 26，unconditional。
- Encounter 98：333,565 → 401,666，distance 29，unconditional。

## 重要限制

這個 index 只證明 fixed-C encount.txt 的刷怪矩形與 group 條件；它不證明玩家能從 incoming landing 走到 rectangle。

- Floor 100 仍需要 exact fixed-C map runtime 才能做 path closure。固定 source map identity 已確認為 gmsv/data/map/sainasu/sainasu，但本輪尚未解出 binary runtime。
- Floor 200 的 source path gmsv/data/map/jyaruga/jalga 已辨識，但目前 binary header / runtime 仍未閉合。
- mixed 不得被標成純 unconditional hunting route。
- unresolved group 不得用 cross-version data 補齊。

Generated output：data/generated/stoneage_start_encounter_target_index.json
Generator：tools/generate_start_encounter_target_index.mjs
