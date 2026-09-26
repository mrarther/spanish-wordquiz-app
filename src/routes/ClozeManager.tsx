import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ClozeSentence } from '../components/ClozeSentence'
import { Chip, Radio } from '../components/FormControls'
import { BUILTIN_CLOZE, clozeTagLabel } from '../data/cloze'
import { VOCAB_CATEGORIES } from '../data/vocab'
import { exportCloze, parseClozeImport, toCustomItem } from '../domain/cloze/io'
import { parseCloze } from '../domain/cloze/parse'
import {
  CLOZE_KIND_LABELS,
  CLOZE_KINDS,
  type ClozeItem,
  type ClozeKind,
} from '../domain/cloze/types'
import { LEVELS, isValid, validateCloze, type ClozeDraft } from '../domain/cloze/validate'
import { TENSES, type Tense } from '../domain/conjugation/types'
import { useClozeStore } from '../store/clozeStore'
import { toggle } from '../utils/list'

type Form = {
  /** 編集中の問題の id。新規なら null */
  id: string | null
  sentence: string
  translation_ja: string
  hint: string
  alternatives: string
  kind: ClozeKind
  tags: string[]
  extraTags: string
  level: string
}

const EMPTY_FORM: Form = {
  id: null,
  sentence: '',
  translation_ja: '',
  hint: '',
  alternatives: '',
  kind: 'conjugation',
  tags: [],
  extraTags: '',
  level: 'A1',
}

/** 種類ごとに選べるタグ（活用は時制、語彙はカテゴリ） */
const TAG_OPTIONS: Record<ClozeKind, string[]> = {
  conjugation: Object.keys(TENSES) as Tense[],
  vocab: VOCAB_CATEGORIES.map((c) => c.id),
}

const splitList = (s: string) => s.split(/[,、]/)

function toDraft(f: Form): ClozeDraft {
  return {
    sentence: f.sentence,
    translation_ja: f.translation_ja,
    hint: f.hint,
    alternatives: splitList(f.alternatives),
    kind: f.kind,
    tags: [...f.tags, ...splitList(f.extraTags)],
    level: f.level,
  }
}

function toForm(item: ClozeItem): Form {
  const known = TAG_OPTIONS[item.kind]
  return {
    id: item.id,
    sentence: item.sentence,
    translation_ja: item.translation_ja,
    hint: item.hint ?? '',
    alternatives: (item.alternatives ?? []).join(', '),
    kind: item.kind,
    tags: item.tags.filter((t) => known.includes(t)),
    extraTags: item.tags.filter((t) => !known.includes(t)).join(', '),
    level: item.level,
  }
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ClozeManager() {
  const customItems = useClozeStore((s) => s.customItems)
  const saveCustom = useClozeStore((s) => s.saveCustom)
  const deleteCustom = useClozeStore((s) => s.deleteCustom)

  const [form, setForm] = useState<Form | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState<{ text: string; details?: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const openForm = (f: Form) => {
    setForm(f)
    setSubmitted(false)
    setMessage(null)
  }

  const save = async () => {
    if (!form) return
    setSubmitted(true)
    const draft = toDraft(form)
    if (!isValid(validateCloze(draft))) return
    await saveCustom([toCustomItem(draft, form.id ?? crypto.randomUUID(), Date.now())])
    setMessage({ text: form.id ? '問題を更新しました' : '問題を追加しました' })
    setForm(null)
  }

  const remove = async (item: ClozeItem) => {
    if (!window.confirm(`この問題を削除しますか？\n${item.sentence}`)) return
    await deleteCustom(item.id)
    setMessage({ text: '問題を削除しました' })
  }

  const exportAll = () => {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
    download(`spanish-wordquiz-cloze-${date}.json`, exportCloze(customItems))
  }

  const importFile = async (file: File) => {
    const reserved = new Set(BUILTIN_CLOZE.map((i) => i.id))
    const { items, errors } = parseClozeImport(
      await file.text(),
      () => crypto.randomUUID(),
      reserved,
    )
    if (items.length) await saveCustom(items)
    setMessage({
      text: `${items.length}件の問題を読み込みました${errors.length ? `（${errors.length}件は読み込めませんでした）` : ''}`,
      details: errors,
    })
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">自作問題の管理</h2>
        <Link to="/cloze" className="text-sm text-blue-700 underline">
          穴埋めの設定へ戻る
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openForm(EMPTY_FORM)}
          className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          問題を追加
        </button>
        <button
          type="button"
          onClick={exportAll}
          disabled={customItems.length === 0}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:opacity-40"
        >
          エクスポート
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
        >
          インポート
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="インポートするファイル"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) importFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {message && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm" role="status">
          <p>{message.text}</p>
          {message.details && message.details.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-red-700">
              {message.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {form && (
        <ClozeForm
          form={form}
          onChange={(patch) => setForm({ ...form, ...patch })}
          showErrors={submitted}
          onSave={save}
          onCancel={() => setForm(null)}
        />
      )}

      <section className="grid gap-2">
        <h3 className="font-semibold">自作問題（{customItems.length}問）</h3>
        {customItems.length === 0 ? (
          <p className="text-sm text-gray-600">
            まだ自作問題はありません。「問題を追加」から作るか、エクスポートしたファイルをインポートしてください。
          </p>
        ) : (
          <ul className="grid gap-2">
            {customItems.map((item) => {
              const parsed = parseCloze(item.sentence)
              return (
                <li
                  key={item.id}
                  className="grid gap-1 rounded-md border border-gray-200 p-3 text-sm"
                >
                  {parsed ? <ClozeSentence parsed={parsed} reveal /> : <p>{item.sentence}</p>}
                  <p className="text-gray-600">{item.translation_ja}</p>
                  <p className="text-xs text-gray-500">
                    {CLOZE_KIND_LABELS[item.kind]}・{item.level}
                    {item.tags.length > 0 && `・${item.tags.map(clozeTagLabel).join('、')}`}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openForm(toForm(item))}
                      className="text-blue-700 underline"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="text-red-700 underline"
                    >
                      削除
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function ClozeForm(props: {
  form: Form
  onChange: (patch: Partial<Form>) => void
  showErrors: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const { form, onChange, showErrors } = props
  const draft = toDraft(form)
  const errors = showErrors ? validateCloze(draft) : {}
  const parsed = parseCloze(form.sentence.trim())

  return (
    <form
      className="grid gap-4 rounded-lg border border-blue-300 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        props.onSave()
      }}
    >
      <h3 className="font-semibold">{form.id ? '問題を編集' : '問題を追加'}</h3>

      <Field
        label="例文"
        help="空欄にする答えを [[ ]] で囲みます（例：Ayer yo [[comí]] paella.）"
        error={errors.sentence}
      >
        <textarea
          aria-label="例文"
          value={form.sentence}
          onChange={(e) => onChange({ sentence: e.target.value })}
          rows={2}
          lang="es"
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </Field>

      <Field label="種類" error={errors.kind}>
        <Radio<ClozeKind>
          value={form.kind}
          onChange={(kind) => onChange({ kind, tags: [] })}
          options={CLOZE_KINDS.map((k) => ({ value: k, label: CLOZE_KIND_LABELS[k] }))}
        />
      </Field>

      <Field
        label={form.kind === 'conjugation' ? 'ヒント（動詞の原形）' : 'ヒント（意味）'}
        help="空欄の後ろに（ ）で表示します。空欄のままでもかまいません"
        error={errors.hint}
      >
        <input
          aria-label="ヒント"
          value={form.hint}
          onChange={(e) => onChange({ hint: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </Field>

      <Field label="日本語訳" error={errors.translation_ja}>
        <input
          aria-label="日本語訳"
          value={form.translation_ja}
          onChange={(e) => onChange({ translation_ja: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </Field>

      <Field
        label="別解"
        help="ほかに正解にしたい答えがあれば、カンマ（, や 、）で区切って入力します"
        error={errors.alternatives}
      >
        <input
          aria-label="別解"
          value={form.alternatives}
          onChange={(e) => onChange({ alternatives: e.target.value })}
          lang="es"
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </Field>

      <Field label="レベル" error={errors.level}>
        <Radio<string>
          value={form.level}
          onChange={(level) => onChange({ level })}
          options={LEVELS.map((l) => ({ value: l, label: l }))}
        />
      </Field>

      <Field
        label={form.kind === 'conjugation' ? 'タグ（時制）' : 'タグ（カテゴリ）'}
        error={errors.tags}
      >
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS[form.kind].map((tag) => (
            <Chip
              key={tag}
              checked={form.tags.includes(tag)}
              onChange={() => onChange({ tags: toggle(form.tags, tag) })}
              label={clozeTagLabel(tag)}
            />
          ))}
        </div>
        <input
          aria-label="その他のタグ"
          value={form.extraTags}
          onChange={(e) => onChange({ extraTags: e.target.value })}
          placeholder="その他のタグ（カンマ区切り）"
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </Field>

      <div className="grid gap-1 rounded-md bg-gray-50 p-3">
        <p className="text-xs font-semibold text-gray-600">プレビュー</p>
        {parsed ? (
          <>
            <ClozeSentence parsed={parsed} hint={form.hint.trim() || undefined} />
            <p className="text-sm text-gray-600">{form.translation_ja}</p>
            <p className="text-sm">
              正解：<span className="font-semibold">{parsed.answer}</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">例文に [[答え]] を1つ入れると表示されます</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          保存
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}

function Field(props: { label: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-sm font-semibold">{props.label}</span>
      {props.children}
      {props.help && <span className="text-xs text-gray-500">{props.help}</span>}
      {props.error && (
        <span className="text-sm text-red-600" role="alert">
          {props.error}
        </span>
      )}
    </div>
  )
}
