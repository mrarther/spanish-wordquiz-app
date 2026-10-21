import type { VocabCategoryFile, VocabWord } from '../domain/vocab/types'
import { VERBS } from './verbs'
import abstract from './vocab/abstract.json'
import adjectives from './vocab/adjectives.json'
import agriculture from './vocab/agriculture.json'
import arts from './vocab/arts.json'
import beauty from './vocab/beauty.json'
import body from './vocab/body.json'
import city from './vocab/city.json'
import clothes from './vocab/clothes.json'
import colors from './vocab/colors.json'
import communication from './vocab/communication.json'
import cooking from './vocab/cooking.json'
import dailyLife from './vocab/daily_life.json'
import environment from './vocab/environment.json'
import events from './vocab/events.json'
import family from './vocab/family.json'
import feelings from './vocab/feelings.json'
import food from './vocab/food.json'
import functionWords from './vocab/function.json'
import geography from './vocab/geography.json'
import greetings from './vocab/greetings.json'
import hobbies from './vocab/hobbies.json'
import jobs from './vocab/jobs.json'
import law from './vocab/law.json'
import materials from './vocab/materials.json'
import measures from './vocab/measures.json'
import medical from './vocab/medical.json'
import nationalities from './vocab/nationalities.json'
import house from './vocab/house.json'
import nature from './vocab/nature.json'
import numbers from './vocab/numbers.json'
import office from './vocab/office.json'
import religion from './vocab/religion.json'
import schoolWork from './vocab/school_work.json'
import shopping from './vocab/shopping.json'
import society from './vocab/society.json'
import space from './vocab/space.json'
import sports from './vocab/sports.json'
import technology from './vocab/technology.json'
import time from './vocab/time.json'
import travel from './vocab/travel.json'

/** 動詞カテゴリは活用クイズと同じ verbs.json から作る（データを二重に持たない） */
const verbs: VocabCategoryFile = {
  id: 'verbs',
  label_ja: '動詞',
  words: VERBS.map((v) => ({ es: v.infinitive, ja: v.meaning_ja, pos: 'verb', level: v.level })),
}

/** 画面に表示するカテゴリの順番 */
const FILES = [
  greetings,
  verbs,
  family,
  nationalities,
  body,
  medical,
  beauty,
  food,
  cooking,
  shopping,
  dailyLife,
  events,
  house,
  clothes,
  city,
  travel,
  schoolWork,
  jobs,
  office,
  time,
  numbers,
  measures,
  materials,
  colors,
  adjectives,
  feelings,
  nature,
  geography,
  space,
  agriculture,
  hobbies,
  sports,
  arts,
  society,
  law,
  religion,
  environment,
  technology,
  abstract,
  communication,
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
