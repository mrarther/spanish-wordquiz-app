import { Link } from 'react-router'

const menu = [
  { title: '活用クイズ', description: '時制・人称ごとの動詞活用', to: '/conjugation' },
  { title: '語彙学習', description: '単語カードと4択・スペル入力' },
  { title: '例文穴埋め', description: '例文の空欄を埋める（自作問題も可）' },
  { title: '総合テスト', description: '全分野を混ぜて実力チェック' },
]

export function Home() {
  return (
    <ul className="grid gap-3">
      {menu.map((item) => {
        const body = (
          <>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-gray-600">{item.description}</p>
          </>
        )
        return (
          <li key={item.title}>
            {item.to ? (
              <Link
                to={item.to}
                className="block rounded-lg border border-gray-300 p-4 hover:border-blue-500 hover:bg-blue-50"
              >
                {body}
              </Link>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 opacity-60">
                {body}
                <p className="mt-1 text-xs text-gray-500">準備中</p>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
