import { describe, expect, it } from 'vitest'
import { fingerValues, matchSign, normalize, type FingerValues, type Point } from './landmarks'
import { CONSONANTS, DIGITS, VOWELS } from './signs'

const WRIST = { x: 0.5, y: 0.8 }
const SCALE = 0.18 // distance poignet → base du majeur, dans l'image

const BONE = 0.05 // longueur de chaque os d'un doigt, dans l'image

/** Rectitude d'un doigt dont les deux articulations sont pliées de `bend` radians (0 = droit). */
function straightnessFor(bend: number): number {
  const dir = (angle: number) => ({ x: Math.sin(angle), y: -Math.cos(angle) })
  const [a, b, c] = [dir(0), dir(bend), dir(2 * bend)]
  return Math.hypot(a.x + b.x + c.x, a.y + b.y + c.y) / 3
}

/** Pliage qui donne la rectitude voulue (recherche par dichotomie : la rectitude baisse quand on plie). */
function bendFor(straightness: number): number {
  let low = 0
  let high = Math.PI / 2
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2
    if (straightnessFor(mid) > straightness) low = mid
    else high = mid
  }
  return (low + high) / 2
}

/** Les trois articulations d'un doigt dont la valeur de dépliement est `value` (0 = replié, 1 = tendu). */
function fingerBones(mcp: Point, value: number, bone = BONE): Point[] {
  const bend = value >= 1 ? 0 : bendFor(0.5 + 0.45 * value)
  const points: Point[] = []
  let current = mcp
  for (const angle of [0, bend, 2 * bend]) {
    current = { x: current.x + bone * Math.sin(angle), y: current.y - bone * Math.cos(angle), z: 0 }
    points.push(current)
  }
  return points
}

/** Main fabriquée, vue de face et droite : seuls les repères utilisés par la détection sont réalistes. */
function makeHand(fingers: FingerValues, pinch = false): Point[] {
  const points: Point[] = Array.from({ length: 21 }, () => ({ x: WRIST.x, y: WRIST.y, z: 0 }))
  const mcpX = [0.43, 0.5, 0.56, 0.62] // index, majeur, annulaire, auriculaire
  points[9] = { x: 0.5, y: WRIST.y - SCALE, z: 0 }
  points[5] = { x: mcpX[0], y: WRIST.y - SCALE * 0.9, z: 0 }
  points[13] = { x: mcpX[2], y: WRIST.y - SCALE * 0.95, z: 0 }
  points[17] = { x: mcpX[3], y: WRIST.y - SCALE * 0.8, z: 0 }
  ;[5, 9, 13, 17].forEach((mcp, i) => {
    // L'auriculaire est plus court (environ 80 %) : c'est ce qui faussait l'ancienne mesure par rapport au poignet.
    fingerBones(points[mcp], fingers[i + 1], i === 3 ? BONE * 0.8 : BONE).forEach((bone, j) => (points[mcp + 1 + j] = bone))
  })
  // Bout du pouce : près du centre de la paume s'il est replié, loin sur le côté s'il est tendu.
  const center = {
    x: [0, 5, 9, 13, 17].reduce((s, i) => s + points[i].x, 0) / 5,
    y: [0, 5, 9, 13, 17].reduce((s, i) => s + points[i].y, 0) / 5,
  }
  const thumbReach = (0.45 + 0.5 * fingers[0]) * SCALE
  points[4] = { x: center.x - thumbReach, y: center.y, z: 0 }
  // Pouce et index qui se touchent : le bout du pouce rejoint le bout de l'index.
  if (pinch) points[4] = { x: points[8].x + 0.01, y: points[8].y, z: 0 }
  return points
}

const score = (id: string, fingers: FingerValues, pinch = false) => {
  const sign = [...VOWELS, ...CONSONANTS].find((s) => s.id === id)!
  const landmarks = makeHand(fingers, pinch)
  return matchSign(normalize(landmarks, 'Right'), sign, landmarks).score
}

const scoreDigit = (id: string, fingers: FingerValues) => {
  const sign = DIGITS.find((s) => s.id === id)!
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

/**
 * Mesures relevées sur une vraie webcam (panneau « Ce que la caméra voit »), qui ont montré
 * que les règles de départ étaient trop strictes pour D, F et O.
 */
describe('signes validés avec des mesures réelles', () => {
  it('D : index tendu, trois autres doigts serrés (9 %, 0 %, 0 %)', () => {
    expect(score('d', [0.21, 1, 0.17, 0, 0])).toBeGreaterThanOrEqual(0.7)
  })

  it('D : refuse un majeur tendu', () => {
    expect(score('d', [0.21, 1, 1, 0, 0])).toBeLessThan(0.7)
  })

  it('F : cercle pouce-index (index lu à 0 %), trois doigts tendus', () => {
    expect(score('f', [0.06, 0, 1, 1, 0.99], true)).toBeGreaterThanOrEqual(0.7)
  })

  it('F : refuse quand le pouce et l’index ne se touchent pas', () => {
    expect(score('f', [1, 0, 1, 1, 1], false)).toBeLessThan(0.7)
  })

  it('F : refuse un annulaire replié', () => {
    expect(score('f', [0.06, 0, 1, 0, 0.99], true)).toBeLessThan(0.7)
  })

  it('O : cercle pouce-doigts, quelle que soit la position exacte de l’index', () => {
    expect(score('o', [0.1, 0.1, 0.5, 0.5, 0.5], true)).toBeGreaterThanOrEqual(0.7)
    expect(score('o', [0.1, 0.5, 0.5, 0.5, 0.5], true)).toBeGreaterThanOrEqual(0.7)
  })
})

/**
 * Main de face, pouce replié en travers de la paume : la mesure doit le voir « replié » même si le bout du pouce
 * est loin de la base de l'index (ce qui faisait refuser B et E tant qu'on ne tournait pas un peu la main).
 */
/**
 * Capture réelle : un 5 (main ouverte) dont l'auriculaire, plus court, était lu à 69 % avec l'ancienne mesure et
 * faisait refuser le 4, le 5, le 9 et tous les nombres avec quatre ou cinq doigts.
 */
describe("l'auriculaire tendu compte comme tendu", () => {
  it('le 5 est accepté : main ouverte, doigts écartés', () => {
    expect(scoreDigit('5', [0.91, 1, 1, 1, 1])).toBeGreaterThanOrEqual(0.7)
  })

  it('le 4 est accepté : quatre doigts tendus, pouce replié', () => {
    expect(scoreDigit('4', [0.05, 1, 1, 1, 1])).toBeGreaterThanOrEqual(0.7)
  })

  it('un auriculaire un peu moins tendu reste accepté pour le 5', () => {
    expect(scoreDigit('5', [0.91, 1, 1, 1, 0.85])).toBeGreaterThanOrEqual(0.7)
  })

  it('le 4 refuse un auriculaire replié', () => {
    expect(scoreDigit('4', [0.05, 1, 1, 1, 0])).toBeLessThan(0.7)
  })

  it('les mesures reflètent la position réelle des doigts', () => {
    const landmarks = makeHand([0, 1, 0, 0, 1])
    const [, index, middle, ring, pinky] = fingerValues(normalize(landmarks, 'Right'))
    expect(index).toBeGreaterThan(0.9)
    expect(pinky).toBeGreaterThan(0.9)
    expect(middle).toBeLessThan(0.1)
    expect(ring).toBeLessThan(0.1)
  })
})

describe('main de face, pouce en travers de la paume', () => {
  const faceOn = (fingers: FingerValues) => {
    const landmarks = makeHand(fingers)
    // Le bout du pouce se pose sur le centre de la paume, côté majeur : loin de la base de l'index.
    landmarks[4] = { x: 0.52, y: 0.68, z: 0 }
    return landmarks
  }
  const scoreOf = (id: string, fingers: FingerValues) => {
    const sign = [...VOWELS, ...CONSONANTS].find((s) => s.id === id)!
    const landmarks = faceOn(fingers)
    return matchSign(normalize(landmarks, 'Right'), sign, landmarks).score
  }

  it('B : quatre doigts tendus, pouce replié sur la paume', () => {
    expect(scoreOf('b', [0, 1, 1, 1, 1])).toBeGreaterThanOrEqual(0.7)
  })

  it('E : doigts en griffe, pouce replié', () => {
    expect(scoreOf('e', [0, 0.35, 0.35, 0.35, 0.35])).toBeGreaterThanOrEqual(0.7)
  })

  it('B : refuse toujours un pouce tendu sur le côté', () => {
    expect(score('b', [1, 1, 1, 1, 1])).toBeLessThan(0.7)
  })
})

describe('M et N : le pouce ne compte pas', () => {
  it.each(['m', 'n'])('%s ignore la position du pouce', (id) => {
    const sign = CONSONANTS.find((s) => s.id === id)!
    expect(sign.ignore).toContain(0)
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
