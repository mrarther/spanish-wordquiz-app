import { useCallback, useEffect } from 'react'
import { useAppSettings } from '../store/appSettingsStore'
import { isSpeechSupported, speak, stopSpeaking } from '../utils/speech'

/** 読み上げがオンで、ブラウザが対応しているときだけ読む say を返す */
export function useSpeech() {
  const speech = useAppSettings((s) => s.settings.speech)
  const lang = useAppSettings((s) => s.settings.speechLang)
  const enabled = speech && isSpeechSupported()
  const say = useCallback(
    (text: string) => {
      if (enabled) speak(text, lang)
    },
    [enabled, lang],
  )
  return { enabled, say }
}

/**
 * key が変わったときに text を自動で読む（同じ文でも問題が変われば読み直す）。
 * text が null なら読まない。画面を離れたら読み上げを止める
 */
export function useAutoSpeak(text: string | null | undefined, key: string) {
  const { say } = useSpeech()
  useEffect(() => {
    if (text) say(text)
  }, [text, key, say])
  useEffect(() => () => stopSpeaking(), [])
}
