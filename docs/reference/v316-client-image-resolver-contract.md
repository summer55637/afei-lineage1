# V3.16 client image resolver contract

V3.16 從 fixed client source 把「tile image ID → graphicNo → ADRNBIN metadata → Real binary payload」這條鏈固定下來。

## Source

BismarckDD/Stoneage 的 client source 在 loadrealbin.h 定義 ADRNBIN，包含 bitmapno、adder、size、xoffset、yoffset、width、height 與 MAP_ATTR。

loadrealbin.cpp::initRealbinFileOpen() 讀取 ADRNBIN records，建立 bitmap-number 到 graphic-number 的索引；realGetNo() 將 map image ID 轉成 graphic number。

同一個 loader 的 realGetImage(graphicNo) 依 ADRNBIN 的 adder 與 size 讀取 Real binary，再交給 client decoder() 取得像素與尺寸。

## Web contract

src/stoneage_client_image_runtime.mjs 將這個 client record 固定成 72-byte little-endian binary record。

它可以建立 image ID → graphic number 的 index，並由 image ID 取得 offset、compressed size、width、height、x/y offset 與 MAP_ATTR 的 hit / height 欄位。

目前 repo 沒有授權可發布的 client image binary，因此這一版不把 client 圖片二進位放入 Pages，也不建立假 PNG。缺少資產時 resolver 返回 null，維持 fail-closed。

Google 搜尋到的舊石器架站資料也交叉證實常見 client 資產檔名為 adrn_136.bin、real_136.bin；這些第三方教學只作檔名／格式佐證，不作本專案素材來源。