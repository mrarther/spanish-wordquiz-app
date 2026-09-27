import { Link } from 'react-router'

const menu = [
  { title: '復習', description: '間違えた問題・忘れかけた問題を解き直す', to: '/review' },
  { title: '活用クイズ', description: '時制・人称ごとの動詞活用', to: '/conjugation' },
  { title: '語彙学習', description: '単語カードと4択・スペル入力', to: '/vocab' },
  { title: '例文穴埋め', description: '例文の空欄を埋める（自作問題も可）', to: '/cloze' },
  { title: '総合テスト', description: '全分野を混ぜて実力チェック', to: '/test' },
  { title: '統計', description: '正答率の推移・苦手な時制と単語・テストのスコア', to: '/stats' },
  { title: '設定', description: '画面のテーマ（ライト・ダーク）、入力補助ボタン', to: '/settings' },
]

export function Home() {
  return (
    <ul className="grid gap-3">
      {menu.map((item) => {
        const body = (
          <>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-ink-muted">{item.description}</p>
          </>
        )
        return (
          <li key={item.title}>
            {item.to ? (
              <Link
                to={item.to}
                className="block rounded-lg border border-line p-4 hover:border-blue-500 hover:bg-accent-soft"
              >
                {body}
              </Link>
            ) : (
              <div className="rounded-lg border border-dashed border-line p-4 opacity-60">
                {body}
                <p className="mt-1 text-xs text-ink-subtle">準備中</p>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
