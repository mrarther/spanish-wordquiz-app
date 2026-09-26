const CHARS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü']

type Props = {
  onInsert: (char: string) => void
  disabled?: boolean
}

/** アクセント付き文字の入力補助ボタン。押しても入力欄のフォーカスを外さない */
export function AccentKeyboard({ onInsert, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHARS.map((c) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(c)}
          className="h-10 w-10 rounded-md border border-gray-300 bg-white text-lg hover:bg-gray-100 disabled:opacity-40"
        >
          {c}
        </button>
      ))}
    </div>
  )
}
