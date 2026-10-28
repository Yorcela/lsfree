import { describe, expect, it } from 'vitest'
import { matchSign, normalize, type FingerValues, type Point } from './landmarks'
import { CONSONANTS, VOWELS } from './signs'

const WRIST = { x: 0.5, y: 0.8 }
const SCALE = 0.18 // distance poignet → base du majeur, dans l'image

/** Main fabriquée, vue de face et droite : seuls les repères utilisés par la détection sont réalistes. */
function makeHand(fingers: FingerValues): Point[] {
  const points: Point[] = Array.from({ length: 21 }, () => ({ x: WRIST.x, y: WRIST.y, z: 0 }))
  const mcpX = [0.43, 0.5, 0.56, 0.62] // index, majeur, annulaire, auriculaire
  const tips = [8, 12, 16, 20]
  points[9] = { x: 0.5, y: WRIST.y - SCALE, z: 0 }
  points[5] = { x: mcpX[0], y: WRIST.y - SCALE * 0.9, z: 0 }
  mcpX.forEach((x, i) => {
    // Bout du doigt à 2 fois la taille de la main du poignet si tendu, à 0,9 fois si replié.
    const reach = (0.9 + fingers[i + 1] * 1.1) * SCALE
    points[tips[i]] = { x, y: WRIST.y - reach, z: 0 }
  })
  // Bout du pouce : près de la base de l'index s'il est replié, loin sur le côté s'il est tendu.
  const thumbReach = 0.02 + fingers[0] * 0.14
  points[4] = { x: mcpX[0] - thumbReach, y: points[5].y - thumbReach * 0.4, z: 0 }
  return points
}

const score = (id: string, fingers: FingerValues) => {
  const sign = [...VOWELS, ...CONSONANTS].find((s) => s.id === id)!
  const landmarks = makeHand(fingers)
  return matchSign(normalize(landmarks, 'Right'), sign, landmarks).score
}

describe('détection des formes de main', () => {
  it('reconnaît le A : poing, pouce sur le côté', () => {
    expect(score('a', [1, 0, 0, 0, 0])).toBeGreaterThanOrEqual(0.7)
  })

  it('distingue le A du E par le pouce', () => {
    expect(score('a', [0, 0, 0, 0, 0])).toBeLessThan(0.7)
  })

  it("reconnaît le I : seul l'auriculaire est tendu", () => {
    expect(score('i', [0, 0, 0, 0, 1])).toBeGreaterThanOrEqual(0.7)
    expect(score('i', [0, 0, 0, 1, 0])).toBeLessThan(0.7)
  })

  it('reconnaît le W : trois doigts tendus', () => {
    expect(score('w', [0, 1, 1, 1, 0])).toBeGreaterThanOrEqual(0.7)
  })
})

describe("le T tolère la position de l'index et du pouce", () => {
  it.each([
    ['index tendu', [0, 1, 1, 1, 1]],
    ['index couché', [0, 0.5, 1, 1, 1]],
    ['index replié', [0, 0, 1, 1, 1]],
    ['pouce sorti', [1, 0.5, 1, 1, 1]],
  ] as [string, FingerValues][])('accepte : %s', (_name, fingers) => {
    expect(score('t', fingers)).toBeGreaterThanOrEqual(0.7)
  })

  it('refuse un annulaire replié', () => {
    expect(score('t', [0, 0.5, 1, 0, 1])).toBeLessThan(0.7)
  })

  it('refuse un poing', () => {
    expect(score('t', [0, 0, 0, 0, 0])).toBeLessThan(0.7)
  })
})
