import { useEffect, useRef } from 'react'
import { useAppSettings } from '../store/appSettingsStore'
import { AccentKeyboard } from './AccentKeyboard'

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  prefix?: string
  /** 送信ボタンの文言（初期値：答える） */
  submitLabel?: string
}

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  disabled,
  prefix,
  submitLabel = '答える',
}: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const showKeyboard = useAppSettings((s) => s.settings.showAccentKeyboard)

  useEffect(() => {
    if (!disabled) ref.current?.focus()
  }, [disabled])

  const insert = (char: string) => {
    const input = ref.current
    const start = input?.selectionStart ?? value.length
    const end = input?.selectionEnd ?? value.length
    onChange(value.slice(0, start) + char + value.slice(end))
    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(start + char.length, start + char.length)
    })
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="flex items-center gap-2">
        {prefix && <span className="text-lg text-ink-subtle">{prefix}</span>}
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          lang="es"
          className="w-full rounded-md border border-line px-3 py-2 text-lg disabled:bg-surface-muted"
          aria-label="答え"
        />
      </div>
      {showKeyboard && <AccentKeyboard onInsert={insert} disabled={disabled} />}
      {!disabled && (
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          {submitLabel}
        </button>
      )}
    </form>
  )
}
