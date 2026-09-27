import { SpeakerIcon } from './Icons'
import { useSpeech } from './useSpeech'

/** スペイン語を読み上げるボタン。読み上げがオフ・非対応なら表示しない */
export function SpeakButton({ text }: { text: string }) {
  const { enabled, say } = useSpeech()
  if (!enabled) return null
  return (
    <button
      type="button"
      onClick={() => say(text)}
      aria-label={`「${text}」を読み上げる`}
      title="読み上げる"
      className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full align-middle text-link hover:bg-surface-muted"
    >
      <SpeakerIcon />
    </button>
  )
}
