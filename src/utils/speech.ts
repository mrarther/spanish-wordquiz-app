/** 読み上げの発音（スペイン・中南米） */
export type SpeechLang = 'es-ES' | 'es-MX'

/** 学習者向けに少しゆっくり読む */
export const SPEECH_RATE = 0.9

export type VoiceLike = { lang: string; name: string }

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  )
}

const normalizeLang = (lang: string) => lang.replace('_', '-').toLowerCase()

/** 地域まで一致する音声 → 同じ言語の音声 → なし（なしのときは言語の指定だけで読む） */
export function pickVoice<T extends VoiceLike>(voices: readonly T[], lang: string): T | undefined {
  const want = normalizeLang(lang)
  const language = want.split('-')[0]
  return (
    voices.find((v) => normalizeLang(v.lang) === want) ??
    voices.find((v) => normalizeLang(v.lang).split('-')[0] === language)
  )
}

let voices: SpeechSynthesisVoice[] = []
let listening = false

/** 端末の音声一覧は読み込みが遅れることがあるので、変わったら取り直す */
function currentVoices(): SpeechSynthesisVoice[] {
  if (!listening) {
    listening = true
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      voices = window.speechSynthesis.getVoices()
    })
  }
  if (voices.length === 0) voices = window.speechSynthesis.getVoices()
  return voices
}

/** 読んでいる途中のものを止めてから、text を読み上げる */
export function speak(text: string, lang: SpeechLang): void {
  if (!isSpeechSupported() || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = SPEECH_RATE
  const voice = pickVoice(currentVoices(), lang)
  if (voice) utterance.voice = voice
  synth.speak(utterance)
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
