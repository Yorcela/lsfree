import { describe, expect, it } from 'vitest'
import { ALPHABET } from './signs'
import {
  ALPHABET_LESSONS,
  ALPHABET_QUIZ,
  NUMBER_LESSONS,
  NUMBER_QUIZ,
  WORD_LESSONS,
  missingRequirements,
  nameLetters,
  presentationLesson,
} from './lessons'

const ids = (name: string) => nameLetters(name).map((s) => s.id)

describe("prénom épelé avec l'alphabet", () => {
  it("donne les lettres du prénom dans l'ordre", () => {
    expect(ids('Alec')).toEqual(['a', 'l', 'e', 'c'])
  })

  it('enlève les accents', () => {
    expect(ids('Éloïse')).toEqual(['e', 'l', 'o', 'i', 's'])
  })

  it("ne garde chaque lettre qu'une fois", () => {
    expect(ids('Anna')).toEqual(['a', 'n'])
  })

  it('ignore les espaces, tirets et apostrophes', () => {
    expect(ids("Jean-Marc d'Or")).toEqual(['j', 'e', 'a', 'n', 'm', 'r', 'c', 'd', 'o'])
  })

  it('ne donne rien pour un prénom vide', () => {
    expect(ids('')).toEqual([])
    expect(ids('  --  ')).toEqual([])
  })
})

describe("quiz de l'alphabet", () => {
  const oneStar = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, 1]))
  const alphabetIds = ALPHABET_LESSONS.map((l) => l.id)

  it('couvre les 26 lettres, une seule fois chacune', () => {
    const ids = ALPHABET_QUIZ.signs.map((s) => s.id)
    expect(ids).toHaveLength(26)
    expect(new Set(ids).size).toBe(26)
  })

  it("les leçons de l'alphabet enseignent exactement les mêmes lettres que le quiz", () => {
    const taught = ALPHABET_LESSONS.flatMap((l) => l.signs.map((s) => s.id)).sort()
    expect(taught).toEqual(ALPHABET.map((s) => s.id).sort())
  })

  it('est une interro directe, sans apprentissage', () => {
    expect(ALPHABET_QUIZ.quizOnly).toBe(true)
  })

  it("est verrouillé tant qu'une leçon de l'alphabet n'a pas d'étoile", () => {
    expect(missingRequirements(ALPHABET_QUIZ, {})).toHaveLength(5)
    expect(missingRequirements(ALPHABET_QUIZ, oneStar(alphabetIds.slice(0, 4)))).toHaveLength(1)
    // Zéro étoile ne compte pas comme réussi.
    expect(missingRequirements(ALPHABET_QUIZ, { ...oneStar(alphabetIds), voyelles: 0 })).toHaveLength(1)
  })

  it('se débloque avec au moins une étoile à chaque leçon', () => {
    expect(missingRequirements(ALPHABET_QUIZ, oneStar(alphabetIds))).toEqual([])
    expect(missingRequirements(ALPHABET_QUIZ, Object.fromEntries(alphabetIds.map((id) => [id, 3])))).toEqual([])
  })

  it("les chiffres et les mots n'entrent pas dans le déverrouillage", () => {
    expect(ALPHABET_QUIZ.requires).toEqual(alphabetIds)
  })
})

describe('leçon « Me présenter »', () => {
  it('commence par « Je » puis épelle le prénom', () => {
    const lesson = presentationLesson('Alec')
    expect(lesson.signs.map((s) => s.id)).toEqual(['je', 'a', 'l', 'e', 'c'])
    expect(lesson.subtitle).toBe('Je + A L E C')
  })
})

describe('séances de nombres', () => {
  const labels = (id: string) => NUMBER_LESSONS.find((l) => l.id === id)!.signs.map((s) => s.label)

  it('quatre séances, dans l\'ordre', () => {
    expect(NUMBER_LESSONS.map((l) => l.id)).toEqual(['nombres-0-10', 'nombres-11-20', 'dizaines', 'grands-nombres'])
  })

  it('de 0 à 10 : onze nombres', () => {
    expect(labels('nombres-0-10')).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
  })

  it('de 11 à 20 : dix nombres', () => {
    expect(labels('nombres-11-20')).toEqual(['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'])
  })

  it('les dizaines : de 30 à 100, de 10 en 10', () => {
    expect(labels('dizaines')).toEqual(['30', '40', '50', '60', '70', '80', '90', '100'])
  })

  it('les grands nombres : mille, dix mille, cent mille, un million', () => {
    expect(labels('grands-nombres')).toEqual(['1000', '10 000', '100 000', '1 million'])
  })

  it('les dizaines et les grands nombres sont signalés « à confirmer »', () => {
    const flagged = NUMBER_LESSONS.filter((l) => l.unverified).map((l) => l.id)
    expect(flagged).toEqual(['dizaines', 'grands-nombres'])
  })
})

describe('quiz des nombres', () => {
  const seen = NUMBER_LESSONS.flatMap((l) => l.signs.map((s) => s.id))

  it('tire 10 questions, parmi tous les nombres vus', () => {
    expect(NUMBER_QUIZ.quizSize).toBe(10)
    expect(NUMBER_QUIZ.quizOnly).toBe(true)
    expect(NUMBER_QUIZ.signs.map((s) => s.id).sort()).toEqual([...seen].sort())
  })

  it("n'a que des nombres enseignés : pas un nombre inventé comme 769 807", () => {
    const allowed = new Set(seen)
    for (const sign of NUMBER_QUIZ.signs) expect(allowed.has(sign.id), sign.id).toBe(true)
    expect(NUMBER_QUIZ.signs.some((s) => s.label.replace(/\s/g, '') === '769807')).toBe(false)
  })

  it('a des signes tous différents (pas deux fois la même question)', () => {
    expect(new Set(NUMBER_QUIZ.signs.map((s) => s.id)).size).toBe(NUMBER_QUIZ.signs.length)
  })

  it('est verrouillé jusqu\'à une étoile à chaque séance', () => {
    const ids = NUMBER_LESSONS.map((l) => l.id)
    expect(missingRequirements(NUMBER_QUIZ, {})).toHaveLength(4)
    expect(missingRequirements(NUMBER_QUIZ, Object.fromEntries(ids.slice(0, 3).map((id) => [id, 2])))).toHaveLength(1)
    expect(missingRequirements(NUMBER_QUIZ, Object.fromEntries(ids.map((id) => [id, 1])))).toEqual([])
  })
})

describe('signes à mouvement', () => {
  it('tout signe à mouvement est détecté par la caméra : dès qu\'il y a un mouvement, la détection est activée', () => {
    const lessons = [
      ...ALPHABET_LESSONS,
      ALPHABET_QUIZ,
      ...NUMBER_LESSONS,
      ...WORD_LESSONS,
      presentationLesson('Alec'),
    ]
    const withoutDetection = lessons.flatMap((l) => l.signs).filter((s) => s.motion && !s.move)
    expect(withoutDetection.map((s) => s.id)).toEqual([])
  })

  it('« Je » est détecté par son mouvement', () => {
    const me = presentationLesson('Alec').signs[0]
    expect(me.id).toBe('je')
    expect(me.move).toEqual({ kind: 'any' })
  })
})
