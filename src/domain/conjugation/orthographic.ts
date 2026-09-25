const isVowel = (c: string | undefined) => c !== undefined && 'aeiouáéíóú'.includes(c)

const baseLetter = (s: string) => s.normalize('NFD')[0] ?? ''

export type JoinOptions = { zc?: boolean }

/**
 * 語幹と語尾をつなぎ、発音を保つための綴り変化を適用する。
 * - -car/-gar/-zar：e の前で qu / gu / c（busqué, llegue, empecé）
 * - -guir/-ger/-gir：a/o の前で g / j（sigo, cojo, elija）
 * - zc 動詞と子音 + -cer/-cir：a/o の前で zc / z（conozco, venzo）
 * - -uir：a/e/o の前で y を挿入（construyo）
 * - 母音 + i + 母音 の i は y に（leyó, cayendo）、母音 + i + 子音 の i にはアクセント（leíste, leído）
 */
export function join(infinitive: string, stem: string, ending: string, opts: JoinOptions = {}) {
  const first = baseLetter(ending)
  const beforeE = first === 'e'
  const beforeAO = first === 'a' || first === 'o'
  let s = stem
  let e = ending

  if (beforeE) {
    if (infinitive.endsWith('car') && s.endsWith('c')) s = s.slice(0, -1) + 'qu'
    else if (infinitive.endsWith('gar') && s.endsWith('g')) s = s + 'u'
    else if (infinitive.endsWith('zar') && s.endsWith('z')) s = s.slice(0, -1) + 'c'
  }
  if (beforeAO) {
    if (infinitive.endsWith('guir') && s.endsWith('gu')) s = s.slice(0, -1)
    else if (/g[ei]r$/.test(infinitive) && s.endsWith('g')) s = s.slice(0, -1) + 'j'
    else if (opts.zc && s.endsWith('c')) s = s.slice(0, -1) + 'zc'
    else if (/[^aeiou]c[ei]r$/.test(infinitive) && s.endsWith('c')) s = s.slice(0, -1) + 'z'
  }
  if (/[^gq]uir$/.test(infinitive) && s.endsWith('u') && (beforeE || beforeAO)) s = s + 'y'

  const stemEndsInVowel = isVowel(s.at(-1)) && !/[gq]u$/.test(s)
  if (stemEndsInVowel && e[0] === 'i' && isVowel(e[1])) e = 'y' + e.slice(1)
  else if (/[aeo]$/.test(s) && e[0] === 'i') e = 'í' + e.slice(1)

  return s + e
}
