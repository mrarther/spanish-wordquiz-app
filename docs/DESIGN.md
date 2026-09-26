# 設計ドキュメント：スペイン語 動詞活用クイズ＆語彙学習アプリ

> このドキュメントは、プロジェクトで決めたことを記録する正式な置き場所です。仕様を変えたときは、このファイルも必ず更新してください。
> 最終更新：2026-09-26

## 1. 目的

スペイン語の次の4つの学習機能を1つにまとめたWebアプリを作ります。GitHub 上にある類似アプリとは別に、ゼロから新しく作ります。

- 動詞の時制・活用クイズ
- 語彙を増やす学習
- 例文穴埋め問題（自作の問題も追加できる）
- 総合テスト

## 2. 決定事項と理由

| #   | 決定事項                                                                                                                                                   | 理由                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Webアプリ**（React + TypeScript + Vite）にし、PWAとしても使えるようにする                                                                                | ストアの審査なしにすぐ公開できる。PWA にすればスマホのホーム画面に追加でき、オフラインでも使える                             |
| D2  | データは**ローカルにだけ保存**する（IndexedDB / Dexie.js）                                                                                                 | サーバーもログインも不要なので、作るのも運用するのも軽い。複数端末で使いたいときは JSON のエクスポート／インポートで対応する |
| D3  | **規則活用はコードで自動生成し、不規則活用だけ辞書JSONに持つ**                                                                                             | 全部の活用形を手で書くとデータが膨大になり、間違いも入りやすい。規則との差分だけを持てば、データを小さく正確に保てる         |
| D4  | 活用の生成順は「規則生成 → 語幹変化 → 綴り変化 → 不規則形で上書き」にする                                                                                  | 変化ごとに処理を分けておくと、それぞれを単体テストで確かめられる                                                             |
| D5  | 例文穴埋め問題は、答えを **`[[答え]]` 記法**で例文に埋め込む                                                                                               | 1行のテキストで問題を書けるので、ユーザーが問題を作りやすい。インポートやエクスポートもしやすい                              |
| D6  | 最初からある穴埋め問題は `src/data/cloze.json` に入れ、ユーザーが作った問題は IndexedDB の `customCloze` に保存する。どちらも同じ型で、`source` で区別する | 出題するときに両者を同じように扱える。ユーザーの問題の id は UUID にして、インポートしても重複しないようにする               |
| D7  | **総合テスト**は活用・語彙・穴埋めを混ぜて出題し、**最後にまとめて採点**する                                                                               | 途中で正誤を出さないことで、本番の試験に近い形で実力を測れる                                                                 |
| D8  | 復習は **SM-2 方式の SRS**（間隔反復）で行う                                                                                                               | 定番のアルゴリズムで実装が軽い。間違えた項目を優先して出題できる                                                             |
| D9  | 画面に依存しないロジックは `src/domain/` にまとめ、純粋関数で書く                                                                                          | Vitest で確実にテストでき、画面側の変更に影響されない                                                                        |
| D10 | Vite 公式テンプレートの標準に合わせ、React 19・**oxlint**・Tailwind v4 を採用する（当初案は React 18・ESLint）                                             | 最新のテンプレートの標準構成をそのまま使うと、設定が少なくて済む。oxlint は高速で、設定ファイルも1つで済む                   |

## 3. 技術スタック

| 用途         | 採用                                   |
| ------------ | -------------------------------------- |
| ビルド       | Vite 8 + React 19 + TypeScript 6       |
| ルーティング | React Router                           |
| 状態管理     | Zustand（設定・セッション）            |
| 永続化       | Dexie.js（IndexedDB）                  |
| スタイル     | Tailwind CSS v4（`@tailwindcss/vite`） |
| PWA          | vite-plugin-pwa                        |
| テスト       | Vitest（ロジック）、Playwright（E2E）  |
| 品質         | oxlint + Prettier                      |

## 4. 機能一覧

### 4.1 活用クイズ

- 出題する時制と法を選べる
  - 直説法：現在、点過去、線過去、未来、過去未来、現在完了など
  - 接続法：現在、過去
  - 命令法
- 出題する人称を選べる。vosotros を含めるかどうかも切り替えられる
- 出題形式は2種類
  - 入力式：アクセント記号の扱いを「厳密」か「ゆるめ」か選べる
  - 4択
- 動詞グループで絞り込める：規則、語幹変化（e→ie、o→ue、e→i）、不規則

### 4.2 語彙学習

- 単語カード：西→日、日→西
- クイズ：4択、スペル入力
- カテゴリ別（食べ物、旅行、仕事など）、CEFR レベル別（A1〜B2）で絞り込める

### 4.3 例文穴埋め問題

- 例文の一部が空欄になっていて、そこに入る語を答える
  - 例：`Ayer yo ___ (comer) paella.` → comí
- 空欄の種類は2つ
  - 動詞活用：動詞の原形をヒントとして表示する
  - 語彙：和訳をヒントとして表示する
- 出題形式：入力式、4択
- 絞り込み：レベル別、タグ別（時制、カテゴリ）
- 最初から入っている問題：`src/data/cloze.json` に収録する
- ユーザーが追加する問題：「問題管理」画面で作る
  - 追加・編集・削除ができる
  - 入力する項目：例文（`[[答え]]` 記法）、和訳、ヒント、別解、タグ
  - 保存する前にプレビューと入力チェックを行う
  - JSON でエクスポート／インポートして、バックアップや共有ができる
- 出題するときは、最初からある問題とユーザーの問題を混ぜる。「自作問題のみ」で絞り込むこともできる

### 4.4 総合テスト

- 活用・語彙・穴埋めの3種類を混ぜて出題する
- 範囲を指定できる：レベル、時制、カテゴリ、自作問題を含めるかどうか
- 問題数と制限時間を指定できる（例：20問／10分）。時間切れになると自動で採点する
- テスト中は1問ごとの正誤を表示しない。最後にまとめて採点し、分野別スコアと間違えた問題の一覧を表示する
- 結果は `testResults` に保存し、統計画面でスコアの推移を表示する

### 4.5 復習システム（SRS）

- SM-2 方式で、次に出題する日を項目ごとに管理する
- 間違えた項目ほど早く、優先して出題する

### 4.6 統計

- 正答率とその推移
- 連続学習日数
- 苦手な時制と苦手な単語の一覧
- 総合テストのスコア推移

### 4.7 設定

- 1回に出題する問題数
- アクセント記号の扱い（厳密／ゆるめ）
- ñ・á などを入力するための補助ボタン

## 5. ディレクトリ構成

```
spanish_wordquiz_app/
├── docs/
│   └── DESIGN.md           # このドキュメント
├── public/                 # アイコン、manifest
├── src/
│   ├── main.tsx / App.tsx
│   ├── routes/             # 画面単位
│   │   ├── Home.tsx
│   │   ├── ConjugationSetup.tsx / ConjugationQuiz.tsx
│   │   ├── VocabSetup.tsx / VocabQuiz.tsx / Flashcards.tsx
│   │   ├── ClozeSetup.tsx / ClozeQuiz.tsx
│   │   ├── ClozeManager.tsx   # 自作問題の一覧・追加・編集・削除、インポート／エクスポート
│   │   ├── TestSetup.tsx / TestRun.tsx / TestResult.tsx  # 総合テスト
│   │   ├── Review.tsx         # SRS 復習
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   ├── components/         # QuizCard, AnswerInput, AccentKeyboard, ProgressBar ...
│   ├── domain/             # 画面に依存しない純粋ロジック（テストの中心）
│   │   ├── conjugation/
│   │   │   ├── types.ts        # Tense, Mood, Person, VerbEntry
│   │   │   ├── regular.ts      # -ar/-er/-ir の規則語尾表
│   │   │   ├── stemChange.ts   # 語幹変化ルール
│   │   │   ├── orthographic.ts # 綴り変化（-car→qu, -gar→gu, -zar→c など）
│   │   │   ├── compound.ts     # haber + 過去分詞の複合時制
│   │   │   └── conjugate.ts    # 入口：conjugate(verb, tense, person)
│   │   ├── quiz/
│   │   │   ├── generator.ts    # 出題生成（ランダム、SRS の重み付け）
│   │   │   ├── distractors.ts  # 4択の誤答選択肢を作る
│   │   │   └── answerCheck.ts  # 正規化、アクセントのゆるめ判定
│   │   ├── cloze/
│   │   │   ├── parse.ts        # "[[答え]]" 記法 ⇔ {before, answer, after} の変換
│   │   │   └── validate.ts     # 自作問題の入力チェック
│   │   ├── test/
│   │   │   ├── compose.ts      # 分野ごとの出題比率に従って総合テストを組み立てる
│   │   │   └── score.ts        # 採点、分野別集計
│   │   └── srs/sm2.ts
│   ├── data/
│   │   ├── verbs.json          # 動詞：不定詞、意味、分類、不規則形の上書き
│   │   ├── vocab/*.json        # カテゴリ別の単語
│   │   └── cloze.json          # 最初から入っている穴埋め問題
│   ├── db/                     # Dexie スキーマ、リポジトリ
│   ├── store/                  # Zustand
│   └── utils/
├── tests/e2e/
├── index.html, vite.config.ts（Vitest 設定を含む）, tsconfig.json, .oxlintrc.json, .prettierrc.json
└── README.md
```

## 6. データ設計

### 6.1 動詞（`verbs.json`）

型の定義は `src/domain/conjugation/types.ts` の `VerbEntry` です。

```ts
{
  infinitive: string;          // "tener"
  meaning_ja: string;          // "持つ"
  group: "regular" | "stem" | "irregular";
  stemChange?: "e>ie" | "o>ue" | "e>i" | "u>ue";
  zc?: boolean;                // conocer → conozco（a/o の前で c → zc）
  preteriteStem?: string;      // 強変化の点過去の語幹（tener → "tuv"）
  futureStem?: string;         // 不規則な未来・過去未来の語幹（tener → "tendr"）
  pastParticiple?: string;     // 不規則な過去分詞（例："hecho"）
  gerund?: string;             // 不規則な現在分詞（例："pudiendo"）
  irregular?: { [tense]: (string | null)[] };  // 規則と違う形だけを書く（null・省略は自動生成の形）
}
```

**自動で導出される形**（データに書く必要はありません）

- 綴り変化：-car/-gar/-zar（busqué）、-ger/-gir（cojo）、-guir（sigo）、子音 + -cer（venzo）、-uir の y 挿入（construyo）、母音語幹の i → y とアクセント（leyó, leíste, leído）
- -ir 語幹変化動詞の弱い変化：点過去3人称（durmió）、接続法現在の nosotros/vosotros（pidamos）、現在分詞（sintiendo）
- 接続法現在：直説法現在の yo を上書きしていて、それが -o で終わる場合は、その形から語幹を作る（tengo → tenga）
- 接続法過去：点過去の3人称複数から作る（tuvieron → tuviera）
- 命令法：肯定の tú は直説法現在の3人称単数、vosotros は不定詞の r を d に替えた形、ほかの人称は接続法現在の形
- 命令法（否定）は "no" を含まない形（hables）を返し、"no" は画面側で表示する
- 複合時制：haber の活用 + 過去分詞（`compound.ts`）

**動詞を追加するときのルール**

- `group: "regular"` の動詞には、不規則用の項目（`stemChange` や `irregular` など）を書かない。綴り変化（-car/-gar/-zar、-ger/-gir、-guir、子音 + -cer/-cir）だけの動詞は regular として扱う
- 次の動詞はエンジンが自動では正しく扱えないので、regular にせず、必要な形を `irregular` などで指定する（`verbs.test.ts` でチェックしている）
  - アクセントが移動する -iar/-uar 動詞（enviar → envío、continuar → continúo）。cambiar・estudiar のような通常の -iar 動詞は regular でよい
  - 母音 + -cer/-cir（conocer は `zc: true`）、-uir（construir）、-eer（leer）
  - 過去分詞が不規則な動詞（abrir → abierto、escribir → escrito、romper → roto）→ `pastParticiple` を指定する
  - 語幹変化動詞（pensar、contar など）→ `group: "stem"` と `stemChange` を指定する

### 6.2 語彙（`vocab/*.json`）

```ts
{ id: string; es: string; ja: string; pos: string; gender?: "m" | "f"; level: "A1" | "A2" | "B1" | "B2"; category: string; example?: string }
```

### 6.3 穴埋め問題（`cloze.json` と `customCloze`）

```ts
{
  id: string;                  // ユーザーの問題は UUID
  sentence: string;            // "Ayer yo [[comí]] paella."
  translation_ja: string;
  hint?: string;               // "comer" など
  alternatives?: string[];     // 別解
  kind: "conjugation" | "vocab";
  tags: string[];
  level: "A1" | "A2" | "B1" | "B2";
  source: "builtin" | "custom";
}
```

### 6.4 IndexedDB のテーブル

| テーブル      | 内容                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| `progress`    | itemId、type（conj/vocab/cloze）、SM-2 のパラメータ（ease, interval, due） |
| `attempts`    | 回答履歴。統計に使う                                                       |
| `customCloze` | ユーザーが追加した穴埋め問題                                               |
| `testResults` | 総合テストの結果（日時、範囲、分野別スコア、誤答した問題の ID）            |
| `settings`    | 設定値                                                                     |

## 7. 作成手順（フェーズごと）

| フェーズ | 内容                                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0        | 設計ドキュメント（このファイル）と README を作る                                                                                                                 |
| 1        | 環境構築：`git init`、Vite（React-TS）の雛形、Tailwind・ESLint・Prettier・Vitest の導入                                                                          |
| 2        | **活用エンジン**：`domain/conjugation/*` を実装し、主要動詞（hablar, comer, vivir, ser, estar, ir, tener, hacer, poder, pedir, buscar など）を網羅的にテストする |
| 3        | 動詞データ：頻出100〜200語の `verbs.json` を作り、辞書や教科書と照らし合わせて検証する                                                                           |
| 4        | 活用クイズの画面：設定 → 出題 → 結果の流れ。入力補助キーボードとアクセントのゆるめ判定も入れる                                                                   |
| 5        | 語彙：A1〜A2 で500語ほどのデータ、単語カード、4択、スペル入力                                                                                                    |
| 6        | 永続化と SRS：Dexie を組み込み、SM-2 で復習画面と出題の重み付けを実装する                                                                                        |
| 7        | 例文穴埋め：`cloze/parse.ts` とテスト、`cloze.json`（約200問）、出題画面、問題管理画面（`customCloze`・インポート／エクスポート）                                |
| 8        | 総合テスト：`test/compose.ts`・`test/score.ts` とテスト、設定・実施（タイマー付き）・結果の3画面、`testResults` への保存                                         |
| 9        | 統計画面                                                                                                                                                         |
| 10       | PWA 化とデプロイ（GitHub Pages か Vercel）                                                                                                                       |
| 11       | 仕上げ：Playwright の E2E、レスポンシブ対応、ダークモード                                                                                                        |

**MVP はフェーズ1〜4**で、活用クイズだけが動く状態です。その後は、語彙 → SRS → 穴埋め → 総合テスト → 統計の順に足していきます。

## 8. 検証方法

- `npm run test`：単体テストを実行する
  - 活用エンジン（不規則動詞を含む正解表と照合）
  - answerCheck、sm2
  - cloze の parse と validate
  - 総合テストの compose と score
- `npm run dev`：ブラウザで各クイズを通しでプレイし、リロードしても履歴が残っているか確認する
- 手動確認（穴埋め）：自作問題を追加 → 出題に出る → 編集・削除 → エクスポートした JSON を別ブラウザでインポートして再現できる
- 手動確認（総合テスト）：20問／制限時間ありで受ける → 時間切れで自動採点される → 結果が統計画面に反映される
- `npx playwright test`：E2E で次の3つを確認する
  - 活用クイズを1セッション完了する
  - 自作の穴埋め問題を追加し、出題されて回答する
  - 総合テストを完了し、結果画面が表示される
- `npm run build && npm run preview`：PWA のインストールとオフライン動作を確認する

## 9. 変更履歴

| 日付       | 内容                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- |
| 2026-09-26 | 初版。例文穴埋め（自作問題の追加を含む）と総合テストを機能に追加                       |
| 2026-09-26 | フェーズ1完了。技術スタックを React 19・oxlint・Tailwind v4 に更新（D10）              |
| 2026-09-26 | フェーズ2完了。活用エンジンを実装し、動詞データに zc・preteriteStem・futureStem を追加 |
| 2026-09-26 | フェーズ3：規則動詞を226語追加し、全250語に。動詞を追加するときのルールを追記          |
