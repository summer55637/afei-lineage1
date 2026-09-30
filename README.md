# afei-lineage1

本倉庫目前已完成舊版可玩網頁的清理，準備重新製作新的遊戲。

## 目前狀態

- `main` 是目前唯一保留的 Git 分支。
- 舊版 `index.html`、`game.html`、`game-live.html`、`play.html` 等網頁入口已移除。
- 舊版 `app.js`、`game.js`、`game.css`、`styles.css` 已移除。
- 舊 GitHub Actions 建置、部署與版本 regression workflows 已移除。
- 舊 `CHANGELOG.md` 與 `.nojekyll` 已移除。
- 目前倉庫不包含可直接遊玩的前端。

## 保留內容

以下內容是之後重新製作時可能需要的研究與資料基礎，因此保留：

- `_evidence/`：研究與來源證據
- `client-assets/`：客戶端相關資產資料
- `data/`：整理後的資料與 runtime 研究結果
- `docs/`：研究文件
- `src/`：來源／研究用程式碼
- `tools/`：解析、產生與驗證工具
- `.gitignore`

## 重建原則

新的可玩網站將從乾淨入口重新建立，不沿用舊版可玩頁面的入口結構。舊版本仍存在於 Git / 已關閉 Pull Request 的歷史參考中，但不再作為目前網站內容。

最後整理：2026-09-30。