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

describe('規則動詞（綴り変化・母音語幹を含む）', () => {
  it.each([
    ['organizar', 'preterite', 0, 'organicé'],
    ['organizar', 'subjunctivePresent', 3, 'organicemos'],
    ['pagar', 'preterite', 0, 'pagué'],
    ['explicar', 'subjunctivePresent', 5, 'expliquen'],
    ['crear', 'preterite', 0, 'creé'],
    ['pasear', 'subjunctivePresent', 3, 'paseemos'],
    ['estudiar', 'present', 0, 'estudio'],
    ['proteger', 'present', 0, 'protejo'],
    ['escoger', 'subjunctivePresent', 2, 'escoja'],
    ['vencer', 'present', 0, 'venzo'],
    ['convencer', 'subjunctivePresent', 1, 'convenzas'],
    ['dirigir', 'present', 0, 'dirijo'],
    ['exigir', 'subjunctivePresent', 3, 'exijamos'],
    ['distinguir', 'present', 0, 'distingo'],
    ['distinguir', 'present', 1, 'distingues'],
    ['distinguir', 'preterite', 2, 'distinguió'],
    ['añadir', 'imperfect', 3, 'añadíamos'],
    ['aprender', 'subjunctiveImperfect', 3, 'aprendiéramos'],
    ['recibir', 'imperativeAffirmative', 4, 'recibid'],
  ] as const)('%s %s[%i] = %s', (inf, tense, person, expected) => {
    expect(conjugate(verb(inf), tense, person)).toBe(expected)
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

describe('追加した不規則動詞', () => {
  it('querer', () =>
    expectTable('querer', {
      present: f('quiero quieres quiere queremos queréis quieren'),
      preterite: f('quise quisiste quiso quisimos quisisteis quisieron'),
      future: f('querré querrás querrá querremos querréis querrán'),
      subjunctivePresent: f('quiera quieras quiera queramos queráis quieran'),
    }))

  it('poner', () => {
    expectTable('poner', {
      present: f('pongo pones pone ponemos ponéis ponen'),
      preterite: f('puse pusiste puso pusimos pusisteis pusieron'),
      future: f('pondré pondrás pondrá pondremos pondréis pondrán'),
      subjunctivePresent: f('ponga pongas ponga pongamos pongáis pongan'),
      imperativeAffirmative: imp('pon ponga pongamos poned pongan'),
    })
    expect(pastParticiple(verb('poner'))).toBe('puesto')
  })

  it('ver', () => {
    expectTable('ver', {
      present: f('veo ves ve vemos veis ven'),
      preterite: f('vi viste vio vimos visteis vieron'),
      imperfect: f('veía veías veía veíamos veíais veían'),
      subjunctivePresent: f('vea veas vea veamos veáis vean'),
      subjunctiveImperfect: f('viera vieras viera viéramos vierais vieran'),
      imperativeAffirmative: imp('ve vea veamos ved vean'),
    })
    expect(pastParticiple(verb('ver'))).toBe('visto')
  })

  it('dar', () =>
    expectTable('dar', {
      present: f('doy das da damos dais dan'),
      preterite: f('di diste dio dimos disteis dieron'),
      subjunctivePresent: f('dé des dé demos deis den'),
      subjunctiveImperfect: f('diera dieras diera diéramos dierais dieran'),
      imperativeAffirmative: imp('da dé demos dad den'),
    }))

  it('saber・caber', () => {
    expectTable('saber', {
      present: f('sé sabes sabe sabemos sabéis saben'),
      preterite: f('supe supiste supo supimos supisteis supieron'),
      future: f('sabré sabrás sabrá sabremos sabréis sabrán'),
      subjunctivePresent: f('sepa sepas sepa sepamos sepáis sepan'),
    })
    expectTable('caber', {
      present: f('quepo cabes cabe cabemos cabéis caben'),
      preterite: f('cupe cupiste cupo cupimos cupisteis cupieron'),
      subjunctivePresent: f('quepa quepas quepa quepamos quepáis quepan'),
    })
  })

  it('oír', () => {
    expectTable('oír', {
      present: f('oigo oyes oye oímos oís oyen'),
      preterite: f('oí oíste oyó oímos oísteis oyeron'),
      future: f('oiré oirás oirá oiremos oiréis oirán'),
      subjunctivePresent: f('oiga oigas oiga oigamos oigáis oigan'),
      imperativeAffirmative: imp('oye oiga oigamos oíd oigan'),
    })
    expect(pastParticiple(verb('oír'))).toBe('oído')
    expect(gerund(verb('oír'))).toBe('oyendo')
  })

  it('caer・traer', () => {
    expectTable('caer', {
      present: f('caigo caes cae caemos caéis caen'),
      preterite: f('caí caíste cayó caímos caísteis cayeron'),
      subjunctivePresent: f('caiga caigas caiga caigamos caigáis caigan'),
    })
    expect(gerund(verb('caer'))).toBe('cayendo')
    expectTable('traer', {
      present: f('traigo traes trae traemos traéis traen'),
      preterite: f('traje trajiste trajo trajimos trajisteis trajeron'),
      subjunctiveImperfect: f('trajera trajeras trajera trajéramos trajerais trajeran'),
    })
    expect(gerund(verb('traer'))).toBe('trayendo')
    expect(pastParticiple(verb('traer'))).toBe('traído')
  })

  it('reír・sonreír', () => {
    expectTable('reír', {
      present: f('río ríes ríe reímos reís ríen'),
      preterite: f('reí reíste rio reímos reísteis rieron'),
      subjunctivePresent: f('ría rías ría riamos riais rían'),
      subjunctiveImperfect: f('riera rieras riera riéramos rierais rieran'),
      imperativeAffirmative: imp('ríe ría riamos reíd rían'),
      future: f('reiré reirás reirá reiremos reiréis reirán'),
    })
    expect(gerund(verb('reír'))).toBe('riendo')
    expect(pastParticiple(verb('reír'))).toBe('reído')
    expect(conjugate(verb('sonreír'), 'preterite', 2)).toBe('sonrió')
  })

  it('salir・valer・andar・mantener・obtener・suponer', () => {
    expect(conjugate(verb('salir'), 'present', 0)).toBe('salgo')
    expect(conjugate(verb('salir'), 'future', 0)).toBe('saldré')
    expect(conjugate(verb('salir'), 'imperativeAffirmative', 1)).toBe('sal')
    expect(conjugate(verb('valer'), 'conditional', 2)).toBe('valdría')
    expect(conjugate(verb('andar'), 'preterite', 5)).toBe('anduvieron')
    expect(conjugate(verb('andar'), 'subjunctiveImperfect', 3)).toBe('anduviéramos')
    expectTable('mantener', {
      present: f('mantengo mantienes mantiene mantenemos mantenéis mantienen'),
      preterite: f('mantuve mantuviste mantuvo mantuvimos mantuvisteis mantuvieron'),
      imperativeAffirmative: imp('mantén mantenga mantengamos mantened mantengan'),
    })
    expect(conjugate(verb('obtener'), 'future', 3)).toBe('obtendremos')
    expect(conjugate(verb('suponer'), 'preterite', 0)).toBe('supuse')
    expect(pastParticiple(verb('suponer'))).toBe('supuesto')
  })

  it('oler（h の付加）', () =>
    expectTable('oler', {
      present: f('huelo hueles huele olemos oléis huelen'),
      subjunctivePresent: f('huela huelas huela olamos oláis huelan'),
      imperativeAffirmative: imp('huele huela olamos oled huelan'),
    }))
})

describe('追加した語幹変化・その他の動詞', () => {
  it.each([
    ['pensar', 'present', 0, 'pienso'],
    ['cerrar', 'subjunctivePresent', 5, 'cierren'],
    ['comenzar', 'preterite', 0, 'comencé'],
    ['negar', 'subjunctivePresent', 0, 'niegue'],
    ['contar', 'present', 3, 'contamos'],
    ['encontrar', 'present', 5, 'encuentran'],
    ['almorzar', 'subjunctivePresent', 0, 'almuerce'],
    ['colgar', 'subjunctivePresent', 1, 'cuelgues'],
    ['entender', 'present', 1, 'entiendes'],
    ['mover', 'subjunctivePresent', 3, 'movamos'],
    ['volver', 'presentPerfect', 0, 'he vuelto'],
    ['resolver', 'pluperfect', 2, 'había resuelto'],
    ['sentir', 'preterite', 2, 'sintió'],
    ['sentir', 'subjunctivePresent', 3, 'sintamos'],
    ['divertir', 'subjunctiveImperfect', 0, 'divirtiera'],
    ['morir', 'preterite', 5, 'murieron'],
    ['morir', 'presentPerfect', 5, 'han muerto'],
    ['servir', 'present', 0, 'sirvo'],
    ['repetir', 'preterite', 2, 'repitió'],
    ['corregir', 'present', 0, 'corrijo'],
    ['conseguir', 'present', 0, 'consigo'],
    ['conseguir', 'subjunctivePresent', 3, 'consigamos'],
    ['enviar', 'present', 0, 'envío'],
    ['enviar', 'present', 3, 'enviamos'],
    ['enviar', 'subjunctivePresent', 4, 'enviéis'],
    ['enviar', 'imperativeAffirmative', 1, 'envía'],
    ['esquiar', 'present', 2, 'esquía'],
    ['continuar', 'present', 0, 'continúo'],
    ['continuar', 'present', 4, 'continuáis'],
    ['actuar', 'subjunctivePresent', 5, 'actúen'],
    ['reunir', 'present', 0, 'reúno'],
    ['reunir', 'present', 3, 'reunimos'],
    ['prohibir', 'present', 2, 'prohíbe'],
    ['abrir', 'presentPerfect', 0, 'he abierto'],
    ['escribir', 'pluperfect', 3, 'habíamos escrito'],
    ['describir', 'presentPerfect', 2, 'ha descrito'],
    ['romper', 'presentPerfect', 1, 'has roto'],
    ['parecer', 'present', 0, 'parezco'],
    ['ofrecer', 'subjunctivePresent', 3, 'ofrezcamos'],
    ['conducir', 'present', 0, 'conduzco'],
    ['conducir', 'preterite', 0, 'conduje'],
    ['conducir', 'preterite', 5, 'condujeron'],
    ['traducir', 'subjunctiveImperfect', 0, 'tradujera'],
    ['destruir', 'present', 0, 'destruyo'],
    ['incluir', 'preterite', 2, 'incluyó'],
    ['creer', 'preterite', 2, 'creyó'],
    ['creer', 'preterite', 1, 'creíste'],
  ] as const)('%s %s[%i] = %s', (inf, tense, person, expected) => {
    expect(conjugate(verb(inf), tense, person)).toBe(expected)
  })

  it('現在分詞', () => {
    expect(gerund(verb('sentir'))).toBe('sintiendo')
    expect(gerund(verb('morir'))).toBe('muriendo')
    expect(gerund(verb('creer'))).toBe('creyendo')
    expect(gerund(verb('destruir'))).toBe('destruyendo')
    expect(pastParticiple(verb('creer'))).toBe('creído')
  })
})

describe('上級の動詞（B1〜B2）', () => {
  it('poner・tener・venir・traer・hacer の複合動詞', () => {
    expectTable('proponer', {
      present: f('propongo propones propone proponemos proponéis proponen'),
      preterite: f('propuse propusiste propuso propusimos propusisteis propusieron'),
      future: f('propondré propondrás propondrá propondremos propondréis propondrán'),
      subjunctivePresent: f('proponga propongas proponga propongamos propongáis propongan'),
      imperativeAffirmative: imp('propón proponga propongamos proponed propongan'),
    })
    expect(pastParticiple(verb('proponer'))).toBe('propuesto')
    expect(pastParticiple(verb('exponer'))).toBe('expuesto')
    expectTable('detener', {
      present: f('detengo detienes detiene detenemos detenéis detienen'),
      preterite: f('detuve detuviste detuvo detuvimos detuvisteis detuvieron'),
      imperativeAffirmative: imp('detén detenga detengamos detened detengan'),
    })
    expect(conjugate(verb('sostener'), 'future', 0)).toBe('sostendré')
    expectTable('convenir', {
      present: f('convengo convienes conviene convenimos convenís convienen'),
      preterite: f('convine conviniste convino convinimos convinisteis convinieron'),
      imperativeAffirmative: imp('convén convenga convengamos convenid convengan'),
    })
    expect(gerund(verb('prevenir'))).toBe('previniendo')
    expect(conjugate(verb('intervenir'), 'conditional', 2)).toBe('intervendría')
    expectTable('atraer', {
      present: f('atraigo atraes atrae atraemos atraéis atraen'),
      preterite: f('atraje atrajiste atrajo atrajimos atrajisteis atrajeron'),
      subjunctiveImperfect: f('atrajera atrajeras atrajera atrajéramos atrajerais atrajeran'),
    })
    expect(gerund(verb('distraer'))).toBe('distrayendo')
    expect(pastParticiple(verb('extraer'))).toBe('extraído')
    expectTable('deshacer', {
      present: f('deshago deshaces deshace deshacemos deshacéis deshacen'),
      preterite: f('deshice deshiciste deshizo deshicimos deshicisteis deshicieron'),
      future: f('desharé desharás deshará desharemos desharéis desharán'),
      imperativeAffirmative: imp('deshaz deshaga deshagamos deshaced deshagan'),
    })
    expect(pastParticiple(verb('deshacer'))).toBe('deshecho')
  })

  it.each([
    ['deducir', 'present', 0, 'deduzco'],
    ['deducir', 'preterite', 5, 'dedujeron'],
    ['aparecer', 'subjunctivePresent', 0, 'aparezca'],
    ['disminuir', 'present', 0, 'disminuyo'],
    ['atribuir', 'preterite', 2, 'atribuyó'],
    ['invertir', 'present', 0, 'invierto'],
    ['invertir', 'preterite', 2, 'invirtió'],
    ['requerir', 'subjunctivePresent', 3, 'requiramos'],
    ['competir', 'present', 1, 'compites'],
    ['concebir', 'preterite', 5, 'concibieron'],
    ['promover', 'present', 2, 'promueve'],
    ['reforzar', 'present', 0, 'refuerzo'],
    ['reforzar', 'preterite', 0, 'reforcé'],
    ['reforzar', 'subjunctivePresent', 2, 'refuerce'],
    ['regar', 'present', 0, 'riego'],
    ['regar', 'preterite', 0, 'regué'],
    ['tropezar', 'subjunctivePresent', 3, 'tropecemos'],
    ['desconfiar', 'present', 0, 'desconfío'],
    ['ejercer', 'present', 0, 'ejerzo'],
    ['rechazar', 'preterite', 0, 'rechacé'],
    ['juzgar', 'subjunctivePresent', 1, 'juzgues'],
    ['aliviar', 'present', 0, 'alivio'],
    ['sobrevivir', 'preterite', 5, 'sobrevivieron'],
  ] as const)('%s %s[%i] = %s', (inf, tense, person, expected) => {
    expect(conjugate(verb(inf), tense, person)).toBe(expected)
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
