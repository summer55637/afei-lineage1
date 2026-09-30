# V3.16 client image resolver contract

V3.16 從 fixed client source 把「tile image ID → graphicNo → ADRNBIN metadata → Real binary payload」這條鏈固定下來。

## Source

`client/stoneage/systeminc/loadrealbin.h` 定義 `ADRNBIN` 與 `MAP_ATTR`；同一公開 client 工具鏈的 `tools/ride_sprite_generator/sprite_data.py` 以 **80 bytes** 為 `adrn_136.bin` 單筆 index record，`pack.py` 也以 `<IIIiiII52s>` 追加相同格式。

重要欄位為：bitmapno、adder、size、xoffset、yoffset、width、height，以及 MAP_ATTR；`bmpnumber` 位於 record 的第 77～80 bytes。

`loadrealbin.cpp::initRealbinFileOpen()` 以 `attr.bmpnumber` 建立 image-number → graphic-number 的索引；`realGetNo()` 取 graphic number。`realGetImage(graphicNo)` 再依 ADRNBIN 的 adder／size 讀取 Real binary 並交給 `decoder()`。

## Web contract

`src/stoneage_client_image_runtime.mjs` 現在固定為 **80-byte little-endian binary record**，並完整解析 hit、height、effect1/effect2、damy_a/b/c 與 bmpnumber。

若 record 長度不是 80 的整數倍，或 record 不足 80 bytes，resolver 直接 fail-closed。

目前 repo 沒有授權可發布的 client image binary，因此這一版仍不把 client 圖片二進位放入 Pages，也不建立假 PNG。