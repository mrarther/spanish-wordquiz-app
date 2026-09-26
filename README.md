# Spanish Word Quiz

スペイン語の動詞活用と語彙を学ぶためのWebアプリ（PWA）です。

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
npm run build      # 本番用にビルド
```

## ドキュメント

- 設計・決定事項：[docs/DESIGN.md](docs/DESIGN.md)
  - 仕様を変えたときは、このファイルも更新してください
