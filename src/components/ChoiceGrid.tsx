import { useEffect } from 'react'
import { choiceIndexFromKey } from '../domain/quiz/choiceKeys'

/** idle：未選択 / selected：選択中（総合テスト） / correct・wrong：回答後の正解・選んだ誤答 */
export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong'

const STATE_CLASS: Record<ChoiceState, string> = {
  idle: 'border-line bg-surface hover:bg-surface-muted',
  selected: 'border-blue-600 bg-accent-soft font-semibold',
  correct: 'border-green-600 bg-success-soft',
  wrong: 'border-red-600 bg-danger-soft',
}

type Props = {
  choices: string[]
  onSelect: (choice: string) => void
  state: (choice: string) => ChoiceState
  /** true なら押せず、数字キーも無視する（回答後など） */
  disabled?: boolean
  lang?: string
  /** 表示だけ変える（命令法の否定に "no" を付けるなど） */
  format?: (choice: string) => string
  large?: boolean
}

/** 入力欄で数字を打っているときは選択にしない */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** 4択のボタン。数字キー（1〜4）でも選べる */
export function ChoiceGrid({ choices, onSelect, state, disabled, lang, format, large }: Props) {
  useEffect(() => {
    if (disabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
      const index = choiceIndexFromKey(e.key, choices.length)
      if (index === null) return
      e.preventDefault()
      onSelect(choices[index])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choices, onSelect, disabled])

  return (
    <div className="grid grid-cols-2 gap-2">
      {choices.map((c, i) => {
        const s = state(c)
        return (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(c)}
            lang={lang}
            aria-pressed={s === 'selected'}
            aria-keyshortcuts={String(i + 1)}
            className={`flex items-center gap-2 rounded-md border px-3 py-3 text-left ${
              large ? 'text-lg' : ''
            } ${STATE_CLASS[s]}`}
          >
            <span
              aria-hidden
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-line text-xs text-ink-subtle"
            >
              {i + 1}
            </span>
            <span className="flex-1 text-center">{format ? format(c) : c}</span>
          </button>
        )
      })}
    </div>
  )
}
