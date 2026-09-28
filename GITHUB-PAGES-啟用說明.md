# 阿肥石器時代 V2.70 — GitHub Pages

本專案可直接用 GitHub Pages 當成遊戲網站，在 PC／Android／iPhone 瀏覽器中遊玩。

## 建議網址

若儲存庫是 `summer55637/afei-lineage1`，啟用後網址會是：

`https://summer55637.github.io/afei-lineage1/`

首頁：`index.html`

遊戲：`game.html`

## 啟用方式

1. 將本專案內容推送到 `main` 分支。
2. GitHub → Settings → Pages。
3. Build and deployment → Source 選 `GitHub Actions`。
4. 等待 `Deploy V2.70 to GitHub Pages` 工作流程完成。
5. 打開 GitHub Pages 顯示的網址。

之後每次推送到 `main`，GitHub Actions 都會重新部署。

## 手機安裝

GitHub Pages 使用 HTTPS，Service Worker／PWA 可以在網頁環境下正常工作。Android Chrome 或 iPhone Safari 可從瀏覽器的「加入主畫面／安裝」入口建立 App。

## 注意

不要用本機 `file://` 直接雙擊 `game.html` 來判斷 GitHub Pages 是否正常；GitHub Pages 提供的是真正的 HTTP/HTTPS 網頁環境。
