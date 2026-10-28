import { describe, expect, it } from 'vitest'
import { starsFor, type Answer, type Outcome } from './scoring'
import { VOWELS } from './signs'

/** Une interro sur les voyelles avec les résultats donnés. */
const answers = (...outcomes: Outcome[]): Answer[] =>
  outcomes.map((outcome, i) => ({ sign: VOWELS[i % VOWELS.length], outcome }))

describe("étoiles de l'interro", () => {
  it('3 étoiles si presque tout est réussi seul', () => {
    expect(starsFor(answers('ok', 'ok', 'ok', 'ok', 'ok'))).toBe(3)
  })

  it('2 étoiles pour environ la moitié', () => {
    expect(starsFor(answers('ok', 'ok', 'ok', 'skipped', 'skipped'))).toBe(2)
    // Cinq indices valent deux points et demi : exactement la moitié.
    expect(starsFor(answers('hint', 'hint', 'hint', 'hint', 'hint'))).toBe(2)
  })

  it('1 étoile pour au moins un cinquième', () => {
    expect(starsFor(answers('ok', 'skipped', 'skipped', 'skipped', 'skipped'))).toBe(1)
  })

  it('0 étoile quand on passe tout : le quiz ne se débloque pas sans signer', () => {
    expect(starsFor(answers('skipped', 'skipped', 'skipped', 'skipped', 'skipped'))).toBe(0)
  })

  it('0 étoile pour un seul signe réussi sur beaucoup de questions', () => {
    const many = answers(...(['ok', ...Array(25).fill('skipped')] as Outcome[]))
    expect(starsFor(many)).toBe(0)
  })

  it('0 étoile sans réponse', () => {
    expect(starsFor([])).toBe(0)
  })
})
