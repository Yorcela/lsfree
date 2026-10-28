import { describe, expect, it } from 'vitest'
import { nameLetters, presentationLesson } from './lessons'

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

describe('leçon « Me présenter »', () => {
  it('commence par « Je » puis épelle le prénom', () => {
    const lesson = presentationLesson('Alec')
    expect(lesson.signs.map((s) => s.id)).toEqual(['je', 'a', 'l', 'e', 'c'])
    expect(lesson.subtitle).toBe('Je + A L E C')
  })
})
