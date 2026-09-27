import { useAppSettings } from '../store/appSettingsStore'
import { isSpeechSupported, stopSpeaking } from '../utils/speech'
import { SpeakerIcon } from './Icons'

/** 画面上部の読み上げのオン・オフ。非対応のブラウザでは表示しない */
export function SpeechToggle() {
  const speech = useAppSettings((s) => s.settings.speech)
  const update = useAppSettings((s) => s.update)
  if (!isSpeechSupported()) return null
  return (
    <button
      type="button"
      aria-pressed={speech}
      aria-label="読み上げ"
      title={speech ? '読み上げ：オン' : '読み上げ：オフ'}
      onClick={() => {
        if (speech) stopSpeaking()
        update({ speech: !speech })
      }}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
        speech ? 'border-blue-600 bg-accent-soft text-ink' : 'border-line text-ink-subtle'
      }`}
    >
      <SpeakerIcon muted={!speech} />
      <span className="hidden sm:inline">読み上げ</span>
    </button>
  )
}
