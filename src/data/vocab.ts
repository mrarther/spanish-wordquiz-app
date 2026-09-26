import type { VocabCategoryFile, VocabWord } from '../domain/vocab/types'
import adjectives from './vocab/adjectives.json'
import body from './vocab/body.json'
import city from './vocab/city.json'
import clothes from './vocab/clothes.json'
import colors from './vocab/colors.json'
import family from './vocab/family.json'
import feelings from './vocab/feelings.json'
import food from './vocab/food.json'
import functionWords from './vocab/function.json'
import greetings from './vocab/greetings.json'
import hobbies from './vocab/hobbies.json'
import house from './vocab/house.json'
import nature from './vocab/nature.json'
import numbers from './vocab/numbers.json'
import schoolWork from './vocab/school_work.json'
import time from './vocab/time.json'
import travel from './vocab/travel.json'

/** 画面に表示するカテゴリの順番 */
const FILES = [
  greetings,
  family,
  body,
  food,
  house,
  clothes,
  city,
  travel,
  schoolWork,
  time,
  numbers,
  colors,
  adjectives,
  feelings,
  nature,
  hobbies,
  functionWords,
] as VocabCategoryFile[]

export const VOCAB_CATEGORIES = FILES.map(({ id, label_ja, words }) => ({
  id,
  label_ja,
  count: words.length,
}))

export const VOCAB: VocabWord[] = FILES.flatMap((file) =>
  file.words.map((w) => ({ ...w, id: `${file.id}:${w.es}`, category: file.id })),
)
