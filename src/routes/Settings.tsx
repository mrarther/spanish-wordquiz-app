import { Link } from 'react-router'
import { Chip, Radio, Section } from '../components/FormControls'
import { useAppSettings, type Theme } from '../store/appSettingsStore'
import { isSpeechSupported, speak, stopSpeaking, type SpeechLang } from '../utils/speech'

const SAMPLE = 'Hola, ¿qué tal? Vamos a practicar español.'

export function Settings() {
  const settings = useAppSettings((s) => s.settings)
  const update = useAppSettings((s) => s.update)

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-bold">設定</h2>

      <Section title="画面のテーマ">
        <Radio<Theme>
          value={settings.theme}
          onChange={(theme) => update({ theme })}
          options={[
            { value: 'system', label: '端末に合わせる' },
            { value: 'light', label: 'ライト' },
            { value: 'dark', label: 'ダーク' },
          ]}
        />
      </Section>

      <Section title="入力">
        <Chip
          checked={settings.showAccentKeyboard}
          onChange={() => update({ showAccentKeyboard: !settings.showAccentKeyboard })}
          label="á・é・ñ などの入力補助ボタンを表示する"
        />
        <p className="text-xs text-ink-subtle">
          スペイン語のキーボードを使っている場合は、表示しなくてもかまいません。
        </p>
      </Section>

      <Section title="読み上げ">
        {isSpeechSupported() ? (
          <>
            <Chip
              checked={settings.speech}
              onChange={() => {
                if (settings.speech) stopSpeaking()
                update({ speech: !settings.speech })
              }}
              label="スペイン語を読み上げる"
            />
            <p className="text-xs text-ink-subtle">
              オンのとき、問題の表示時や回答後にスペイン語を自動で読み上げ、スピーカーのボタンでもう一度聞けます。答えが分かってしまうものは回答するまで読みません。画面上部のボタンでも切り替えられます。
            </p>
            <Radio<SpeechLang>
              value={settings.speechLang}
              onChange={(speechLang) => update({ speechLang })}
              options={[
                { value: 'es-ES', label: 'スペインの発音' },
                { value: 'es-MX', label: '中南米の発音' },
              ]}
            />
            <div>
              <button
                type="button"
                onClick={() => speak(SAMPLE, settings.speechLang)}
                className="rounded-md border border-line px-3 py-1 text-sm hover:bg-surface-muted"
              >
                試しに聞く
              </button>
            </div>
            <p className="text-xs text-ink-subtle">
              音声は端末に入っているものを使います。スペイン語の音声がない端末では、発音が不自然になることがあります。
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-muted">このブラウザは読み上げに対応していません。</p>
        )}
      </Section>

      <Section title="クイズごとの設定">
        <p className="text-sm text-ink-muted">
          問題数・アクセント記号の扱い・出題形式は、それぞれのクイズの設定画面で選びます。
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {[
            ['/conjugation', '活用クイズ'],
            ['/vocab', '語彙学習'],
            ['/cloze', '例文穴埋め'],
            ['/test', '総合テスト'],
          ].map(([to, label]) => (
            <li key={to}>
              <Link to={to} className="text-link underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="学習データ">
        <p className="text-sm text-ink-muted">
          学習の記録と設定は、このブラウザの中（IndexedDB）にだけ保存されます。別の端末やブラウザとは共有されません。自作の穴埋め問題は
          <Link to="/cloze/manage" className="text-link underline">
            自作問題の管理
          </Link>
          からエクスポートできます。
        </p>
      </Section>
    </div>
  )
}
