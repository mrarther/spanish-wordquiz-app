import type { ParsedCloze } from '../domain/cloze/parse'

type Props = {
  parsed: ParsedCloze
  hint?: string
  /** true なら空欄に答えを入れて強調表示する */
  reveal?: boolean
  className?: string
}

/** 例文を、空欄（またはハイライトした答え）とヒント付きで表示する */
export function ClozeSentence({ parsed, hint, reveal, className }: Props) {
  return (
    <p lang="es" className={className}>
      {parsed.before}
      {reveal ? (
        <span className="rounded bg-green-100 px-1 font-semibold text-green-800">
          {parsed.answer}
        </span>
      ) : (
        <span className="inline-block min-w-16 border-b-2 border-gray-500" aria-label="空欄">
          &nbsp;
        </span>
      )}
      {hint && <span className="ml-1 text-gray-500">（{hint}）</span>}
      {parsed.after}
    </p>
  )
}
