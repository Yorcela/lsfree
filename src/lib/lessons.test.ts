import { describe, expect, it } from 'vitest'
import { ALPHABET } from './signs'
import { ALPHABET_LESSONS, ALPHABET_QUIZ, missingRequirements, nameLetters, presentationLesson } from './lessons'

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
