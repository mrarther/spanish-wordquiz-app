const BLANK = /\[\[([^[\]]*)\]\]/g

export type ParsedCloze = {
  before: string
  answer: string
  after: string
}

/** [[答え]] の数を数える */
export function countBlanks(sentence: string): number {
  return [...sentence.matchAll(BLANK)].length
}

/** [[ ]] の外に [[ や ]] が残っていないか（"[[comí]" のような書き間違い） */
export function hasStrayBrackets(sentence: string): boolean {
  const rest = sentence.replace(BLANK, '')
  return rest.includes('[[') || rest.includes(']]')
}

/** 空欄がちょうど1つで、答えが空でなければ分解する。それ以外は null */
export function parseCloze(sentence: string): ParsedCloze | null {
  const matches = [...sentence.matchAll(BLANK)]
  if (matches.length !== 1 || hasStrayBrackets(sentence)) return null
  const m = matches[0]
  const answer = m[1].trim()
  if (!answer) return null
  const start = m.index ?? 0
  return {
    before: sentence.slice(0, start),
    answer,
    after: sentence.slice(start + m[0].length),
  }
}

export function formatCloze({ before, answer, after }: ParsedCloze): string {
  return `${before}[[${answer}]]${after}`
}
