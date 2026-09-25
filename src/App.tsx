const menu = [
  { title: '活用クイズ', description: '時制・人称ごとの動詞活用' },
  { title: '語彙学習', description: '単語カードと4択・スペル入力' },
  { title: '例文穴埋め', description: '例文の空欄を埋める（自作問題も可）' },
  { title: '総合テスト', description: '全分野を混ぜて実力チェック' },
]

function App() {
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Spanish Word Quiz</h1>
      <ul className="grid gap-3">
        {menu.map((item) => (
          <li key={item.title} className="rounded-lg border border-gray-300 p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-gray-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
