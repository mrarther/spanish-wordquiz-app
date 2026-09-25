import { describe, expect, it } from 'vitest'
import { findVerb } from '../../data/verbs'
import { conjugate, conjugateAll, gerund, pastParticiple } from './conjugate'
import type { Tense } from './types'

function verb(infinitive: string) {
  const v = findVerb(infinitive)
  if (!v) throw new Error(`verbs.json に ${infinitive} がありません`)
  return v
}

/** "hablo hablas ..." を6人称の配列に */
const f = (s: string) => s.split(' ')
/** 命令法は yo が存在しないので先頭を null にする */
const imp = (s: string) => [null, ...f(s)]

type Table = Partial<Record<Tense, (string | null)[]>>

function expectTable(infinitive: string, table: Table) {
  for (const [tense, forms] of Object.entries(table)) {
    expect(conjugateAll(verb(infinitive), tense as Tense), `${infinitive} ${tense}`).toEqual(forms)
  }
}

describe('規則動詞', () => {
  it('hablar', () =>
    expectTable('hablar', {
      present: f('hablo hablas habla hablamos habláis hablan'),
      preterite: f('hablé hablaste habló hablamos hablasteis hablaron'),
      imperfect: f('hablaba hablabas hablaba hablábamos hablabais hablaban'),
      future: f('hablaré hablarás hablará hablaremos hablaréis hablarán'),
      conditional: f('hablaría hablarías hablaría hablaríamos hablaríais hablarían'),
      subjunctivePresent: f('hable hables hable hablemos habléis hablen'),
      subjunctiveImperfect: f('hablara hablaras hablara habláramos hablarais hablaran'),
      imperativeAffirmative: imp('habla hable hablemos hablad hablen'),
      imperativeNegative: imp('hables hable hablemos habléis hablen'),
    }))

  it('comer', () =>
    expectTable('comer', {
      present: f('como comes come comemos coméis comen'),
      preterite: f('comí comiste comió comimos comisteis comieron'),
      imperfect: f('comía comías comía comíamos comíais comían'),
      future: f('comeré comerás comerá comeremos comeréis comerán'),
      subjunctivePresent: f('coma comas coma comamos comáis coman'),
      subjunctiveImperfect: f('comiera comieras comiera comiéramos comierais comieran'),
      imperativeAffirmative: imp('come coma comamos comed coman'),
    }))

  it('vivir', () =>
    expectTable('vivir', {
      present: f('vivo vives vive vivimos vivís viven'),
      preterite: f('viví viviste vivió vivimos vivisteis vivieron'),
      imperfect: f('vivía vivías vivía vivíamos vivíais vivían'),
      future: f('viviré vivirás vivirá viviremos viviréis vivirán'),
      subjunctivePresent: f('viva vivas viva vivamos viváis vivan'),
      subjunctiveImperfect: f('viviera vivieras viviera viviéramos vivierais vivieran'),
      imperativeAffirmative: imp('vive viva vivamos vivid vivan'),
    }))

  it('過去分詞・現在分詞', () => {
    expect(pastParticiple(verb('hablar'))).toBe('hablado')
    expect(pastParticiple(verb('comer'))).toBe('comido')
    expect(gerund(verb('vivir'))).toBe('viviendo')
  })
})

describe('綴り変化', () => {
  it('buscar（c → qu）', () =>
    expectTable('buscar', {
      preterite: f('busqué buscaste buscó buscamos buscasteis buscaron'),
      subjunctivePresent: f('busque busques busque busquemos busquéis busquen'),
      imperativeAffirmative: imp('busca busque busquemos buscad busquen'),
    }))

  it('llegar（g → gu）', () => {
    expect(conjugate(verb('llegar'), 'preterite', 0)).toBe('llegué')
    expect(conjugate(verb('llegar'), 'subjunctivePresent', 3)).toBe('lleguemos')
  })

  it('coger（g → j）', () => {
    expect(conjugate(verb('coger'), 'present', 0)).toBe('cojo')
    expect(conjugate(verb('coger'), 'present', 1)).toBe('coges')
    expect(conjugate(verb('coger'), 'subjunctivePresent', 0)).toBe('coja')
  })

  it('conocer（c → zc）', () => {
    expect(conjugate(verb('conocer'), 'present', 0)).toBe('conozco')
    expect(conjugate(verb('conocer'), 'present', 1)).toBe('conoces')
    expect(conjugate(verb('conocer'), 'subjunctivePresent', 3)).toBe('conozcamos')
  })

  it('construir（y の挿入）', () =>
    expectTable('construir', {
      present: f('construyo construyes construye construimos construís construyen'),
      preterite: f('construí construiste construyó construimos construisteis construyeron'),
      subjunctivePresent: f('construya construyas construya construyamos construyáis construyan'),
    }))

  it('leer（i → y とアクセント）', () => {
    expectTable('leer', {
      preterite: f('leí leíste leyó leímos leísteis leyeron'),
      subjunctiveImperfect: f('leyera leyeras leyera leyéramos leyerais leyeran'),
    })
    expect(pastParticiple(verb('leer'))).toBe('leído')
    expect(gerund(verb('leer'))).toBe('leyendo')
    expect(pastParticiple(verb('construir'))).toBe('construido')
    expect(gerund(verb('construir'))).toBe('construyendo')
  })
})

describe('語幹変化動詞', () => {
  it('pedir（e → i）', () => {
    expectTable('pedir', {
      present: f('pido pides pide pedimos pedís piden'),
      preterite: f('pedí pediste pidió pedimos pedisteis pidieron'),
      subjunctivePresent: f('pida pidas pida pidamos pidáis pidan'),
      subjunctiveImperfect: f('pidiera pidieras pidiera pidiéramos pidierais pidieran'),
      imperativeAffirmative: imp('pide pida pidamos pedid pidan'),
    })
    expect(gerund(verb('pedir'))).toBe('pidiendo')
  })

  it('empezar（e → ie と z → c）', () =>
    expectTable('empezar', {
      present: f('empiezo empiezas empieza empezamos empezáis empiezan'),
      preterite: f('empecé empezaste empezó empezamos empezasteis empezaron'),
      subjunctivePresent: f('empiece empieces empiece empecemos empecéis empiecen'),
    }))

  it('jugar（u → ue と g → gu）', () =>
    expectTable('jugar', {
      present: f('juego juegas juega jugamos jugáis juegan'),
      preterite: f('jugué jugaste jugó jugamos jugasteis jugaron'),
      subjunctivePresent: f('juegue juegues juegue juguemos juguéis jueguen'),
    }))

  it('dormir（o → ue、-ir の弱い変化 o → u）', () => {
    expectTable('dormir', {
      present: f('duermo duermes duerme dormimos dormís duermen'),
      preterite: f('dormí dormiste durmió dormimos dormisteis durmieron'),
      subjunctivePresent: f('duerma duermas duerma durmamos durmáis duerman'),
      subjunctiveImperfect: f('durmiera durmieras durmiera durmiéramos durmierais durmieran'),
    })
    expect(gerund(verb('dormir'))).toBe('durmiendo')
  })

  it('preferir（e → ie、-ir の弱い変化 e → i）', () => {
    expectTable('preferir', {
      present: f('prefiero prefieres prefiere preferimos preferís prefieren'),
      preterite: f('preferí preferiste prefirió preferimos preferisteis prefirieron'),
      subjunctivePresent: f('prefiera prefieras prefiera prefiramos prefiráis prefieran'),
    })
    expect(gerund(verb('preferir'))).toBe('prefiriendo')
  })

  it('seguir（e → i と gu → g）', () => {
    expectTable('seguir', {
      present: f('sigo sigues sigue seguimos seguís siguen'),
      preterite: f('seguí seguiste siguió seguimos seguisteis siguieron'),
      subjunctivePresent: f('siga sigas siga sigamos sigáis sigan'),
    })
    expect(gerund(verb('seguir'))).toBe('siguiendo')
  })

  it('elegir（e → i と g → j）', () =>
    expectTable('elegir', {
      present: f('elijo eliges elige elegimos elegís eligen'),
      preterite: f('elegí elegiste eligió elegimos elegisteis eligieron'),
      subjunctivePresent: f('elija elijas elija elijamos elijáis elijan'),
    }))
})

describe('不規則動詞', () => {
  it('ser', () => {
    expectTable('ser', {
      present: f('soy eres es somos sois son'),
      preterite: f('fui fuiste fue fuimos fuisteis fueron'),
      imperfect: f('era eras era éramos erais eran'),
      future: f('seré serás será seremos seréis serán'),
      conditional: f('sería serías sería seríamos seríais serían'),
      subjunctivePresent: f('sea seas sea seamos seáis sean'),
      subjunctiveImperfect: f('fuera fueras fuera fuéramos fuerais fueran'),
      imperativeAffirmative: imp('sé sea seamos sed sean'),
      imperativeNegative: imp('seas sea seamos seáis sean'),
    })
    expect(pastParticiple(verb('ser'))).toBe('sido')
    expect(gerund(verb('ser'))).toBe('siendo')
  })

  it('estar', () =>
    expectTable('estar', {
      present: f('estoy estás está estamos estáis están'),
      preterite: f('estuve estuviste estuvo estuvimos estuvisteis estuvieron'),
      imperfect: f('estaba estabas estaba estábamos estabais estaban'),
      subjunctivePresent: f('esté estés esté estemos estéis estén'),
      subjunctiveImperfect: f('estuviera estuvieras estuviera estuviéramos estuvierais estuvieran'),
      imperativeAffirmative: imp('está esté estemos estad estén'),
      imperativeNegative: imp('estés esté estemos estéis estén'),
    }))

  it('ir', () => {
    expectTable('ir', {
      present: f('voy vas va vamos vais van'),
      preterite: f('fui fuiste fue fuimos fuisteis fueron'),
      imperfect: f('iba ibas iba íbamos ibais iban'),
      future: f('iré irás irá iremos iréis irán'),
      conditional: f('iría irías iría iríamos iríais irían'),
      subjunctivePresent: f('vaya vayas vaya vayamos vayáis vayan'),
      subjunctiveImperfect: f('fuera fueras fuera fuéramos fuerais fueran'),
      imperativeAffirmative: imp('ve vaya vamos id vayan'),
      imperativeNegative: imp('vayas vaya vayamos vayáis vayan'),
    })
    expect(pastParticiple(verb('ir'))).toBe('ido')
    expect(gerund(verb('ir'))).toBe('yendo')
  })

  it('tener', () =>
    expectTable('tener', {
      present: f('tengo tienes tiene tenemos tenéis tienen'),
      preterite: f('tuve tuviste tuvo tuvimos tuvisteis tuvieron'),
      future: f('tendré tendrás tendrá tendremos tendréis tendrán'),
      conditional: f('tendría tendrías tendría tendríamos tendríais tendrían'),
      subjunctivePresent: f('tenga tengas tenga tengamos tengáis tengan'),
      subjunctiveImperfect: f('tuviera tuvieras tuviera tuviéramos tuvierais tuvieran'),
      imperativeAffirmative: imp('ten tenga tengamos tened tengan'),
    }))

  it('hacer', () => {
    expectTable('hacer', {
      present: f('hago haces hace hacemos hacéis hacen'),
      preterite: f('hice hiciste hizo hicimos hicisteis hicieron'),
      future: f('haré harás hará haremos haréis harán'),
      subjunctivePresent: f('haga hagas haga hagamos hagáis hagan'),
      subjunctiveImperfect: f('hiciera hicieras hiciera hiciéramos hicierais hicieran'),
      imperativeAffirmative: imp('haz haga hagamos haced hagan'),
    })
    expect(pastParticiple(verb('hacer'))).toBe('hecho')
  })

  it('poder', () => {
    expectTable('poder', {
      present: f('puedo puedes puede podemos podéis pueden'),
      preterite: f('pude pudiste pudo pudimos pudisteis pudieron'),
      future: f('podré podrás podrá podremos podréis podrán'),
      subjunctivePresent: f('pueda puedas pueda podamos podáis puedan'),
      subjunctiveImperfect: f('pudiera pudieras pudiera pudiéramos pudierais pudieran'),
    })
    expect(gerund(verb('poder'))).toBe('pudiendo')
  })

  it('decir', () => {
    expectTable('decir', {
      present: f('digo dices dice decimos decís dicen'),
      preterite: f('dije dijiste dijo dijimos dijisteis dijeron'),
      future: f('diré dirás dirá diremos diréis dirán'),
      subjunctivePresent: f('diga digas diga digamos digáis digan'),
      subjunctiveImperfect: f('dijera dijeras dijera dijéramos dijerais dijeran'),
      imperativeAffirmative: imp('di diga digamos decid digan'),
    })
    expect(pastParticiple(verb('decir'))).toBe('dicho')
    expect(gerund(verb('decir'))).toBe('diciendo')
  })

  it('venir', () => {
    expectTable('venir', {
      present: f('vengo vienes viene venimos venís vienen'),
      preterite: f('vine viniste vino vinimos vinisteis vinieron'),
      future: f('vendré vendrás vendrá vendremos vendréis vendrán'),
      subjunctivePresent: f('venga vengas venga vengamos vengáis vengan'),
      imperativeAffirmative: imp('ven venga vengamos venid vengan'),
    })
    expect(gerund(verb('venir'))).toBe('viniendo')
  })
})

describe('複合時制', () => {
  it('haber + 過去分詞', () => {
    expect(conjugateAll(verb('hablar'), 'presentPerfect')).toEqual([
      'he hablado',
      'has hablado',
      'ha hablado',
      'hemos hablado',
      'habéis hablado',
      'han hablado',
    ])
    expect(conjugate(verb('hacer'), 'pluperfect', 2)).toBe('había hecho')
    expect(conjugate(verb('leer'), 'futurePerfect', 3)).toBe('habremos leído')
    expect(conjugate(verb('decir'), 'conditionalPerfect', 0)).toBe('habría dicho')
    expect(conjugate(verb('ir'), 'subjunctivePresentPerfect', 1)).toBe('hayas ido')
    expect(conjugate(verb('ser'), 'subjunctivePluperfect', 3)).toBe('hubiéramos sido')
  })
})

describe('命令法の yo', () => {
  it('存在しないので null', () => {
    expect(conjugate(verb('hablar'), 'imperativeAffirmative', 0)).toBeNull()
    expect(conjugate(verb('hablar'), 'imperativeNegative', 0)).toBeNull()
  })
})
