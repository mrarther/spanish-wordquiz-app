# Spanish Word Quiz

スペイン語の動詞活用と語彙を学ぶためのWebアプリ（PWA）です。

**公開 URL：https://mrarther.github.io/spanish-wordquiz-app/**

- スマホではブラウザのメニューから「ホーム画面に追加」、パソコンの Chrome ではアドレスバーのインストールボタンで、アプリとして使えます
- 一度開けばオフラインでも使えます。学習の記録は使っているブラウザの中（IndexedDB）にだけ保存され、サーバーには送られません

## 主な機能

- 動詞の時制・活用クイズ
- 語彙学習（単語カード、4択、スペル入力）
- 例文穴埋め問題（自作の問題も追加できる）
- 総合テスト（全分野を混ぜて出題し、最後にまとめて採点）
- SRS（間隔反復）による復習、学習統計

## 起動方法

Node.js 24 が必要です（`.nvmrc` があるので、nvm を使っている場合は `nvm use` で切り替えられます）。

```bash
npm install
npm run dev        # 開発サーバーを起動
npm test           # 単体テスト（Vitest）
npm run test:e2e   # E2E テスト（Playwright。インストール済みの Google Chrome を使う）
npm run lint       # 静的チェック（oxlint）
npm run format     # コード整形（Prettier）
npm run build      # 本番用にビルド（dist/。パスは /spanish-wordquiz-app/）
npm run preview    # ビルドした結果を確認（http://localhost:4173/spanish-wordquiz-app/）
npm run icons      # アイコン（public/）を作り直す
```

## 公開の流れ

`main` ブランチに push すると、GitHub Actions（`.github/workflows/deploy.yml`）が静的チェック・整形チェック・単体テスト・ビルド・E2E テストを行い、すべて通ったら GitHub Pages に公開します。プルリクエストではテストだけを行います。

## ドキュメント

- 設計・決定事項：[docs/DESIGN.md](docs/DESIGN.md)
  - 仕様を変えたときは、このファイルも更新してください
