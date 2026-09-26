import type { Level } from '../vocab/types'
import type { ClozeItem, ClozeKind } from './types'
import { cleanDraft, isValid, validateCloze, type ClozeDraft } from './validate'

/** エクスポートする JSON の形式。読み込むときは、この形か問題の配列だけを受け付ける */
export const EXPORT_HEADER = { app: 'spanish-wordquiz', type: 'cloze', version: 1 } as const

export function exportCloze(items: readonly ClozeItem[]): string {
  const data = items.map(
    ({ id, sentence, translation_ja, hint, alternatives, kind, tags, level }) => ({
      id,
      sentence,
      translation_ja,
      ...(hint ? { hint } : {}),
      ...(alternatives?.length ? { alternatives } : {}),
      kind,
      tags,
      level,
    }),
  )
  return JSON.stringify({ ...EXPORT_HEADER, items: data }, null, 2) + '\n'
}

/** 検査済みの下書きから自作問題を作る */
export function toCustomItem(draft: ClozeDraft, id: string, now: number): ClozeItem {
  const d = cleanDraft(draft)
  return {
    id,
    sentence: d.sentence,
    translation_ja: d.translation_ja,
    ...(d.hint ? { hint: d.hint } : {}),
    ...(d.alternatives?.length ? { alternatives: d.alternatives } : {}),
    kind: d.kind as ClozeKind,
    tags: d.tags ?? [],
    level: d.level as Level,
    source: 'custom',
    updatedAt: now,
  }
}

export type ImportResult = {
  items: ClozeItem[]
  /** 読み込めなかった問題の説明（「3件目：…」） */
  errors: string[]
}

const asString = (x: unknown) => (typeof x === 'string' ? x : '')
const asStrings = (x: unknown) =>
  Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : undefined

/**
 * エクスポートした JSON を読み込む。誤りのある問題は飛ばし、理由を errors に入れる。
 * id がない・組み込み問題と同じ・ファイル内で重複する場合は、新しい id を付ける
 */
export function parseClozeImport(
  text: string,
  newId: () => string,
  reservedIds: ReadonlySet<string>,
  now = Date.now(),
): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { items: [], errors: ['JSON として読み込めませんでした'] }
  }
  const list = Array.isArray(data) ? data : (data as { items?: unknown })?.items
  if (!Array.isArray(list)) {
    return { items: [], errors: ['問題の一覧（items）が見つかりませんでした'] }
  }

  const items: ClozeItem[] = []
  const errors: string[] = []
  const used = new Set<string>()
  list.forEach((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>
    const draft: ClozeDraft = {
      sentence: asString(r.sentence),
      translation_ja: asString(r.translation_ja),
      hint: asString(r.hint) || undefined,
      alternatives: asStrings(r.alternatives),
      kind: asString(r.kind),
      tags: asStrings(r.tags),
      level: asString(r.level),
    }
    const problems = validateCloze(draft)
    if (!isValid(problems)) {
      errors.push(`${i + 1}件目：${Object.values(problems).join('、')}`)
      return
    }
    let id = asString(r.id).trim()
    if (!id || reservedIds.has(id) || used.has(id)) id = newId()
    used.add(id)
    items.push(toCustomItem(draft, id, now))
  })
  return { items, errors }
}
