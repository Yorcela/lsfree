import { describe, expect, it } from 'vitest'
import { detectMotion, pathDistance, resample, type HandPoint, type Sample } from './motion'

const SCALE = 0.15
const FRAME_MS = 33

const hand = (x: number, y: number, extra: Partial<HandPoint> = {}): HandPoint => ({
  x,
  y,
  scale: SCALE,
  tipX: x,
  tipY: y - SCALE,
  ...extra,
})

/** Une main qui suit les positions données, une image toutes les 33 ms. */
function track(positions: [number, number][]): Sample[] {
  return positions.map(([x, y], i) => ({ t: i * FRAME_MS, hands: [hand(x, y)] }))
}

const now = (samples: Sample[]) => samples[samples.length - 1].t

/** Positions régulières entre deux points. */
function line(from: [number, number], to: [number, number], steps: number): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => [
    from[0] + ((to[0] - from[0]) * i) / steps,
    from[1] + ((to[1] - from[1]) * i) / steps,
  ])
}

/** Trajectoire dans le repère de l'élève (comme dans le miroir) : x est retourné pour obtenir l'image brute. */
function userPath(points: [number, number][], size: number, origin: [number, number]): [number, number][] {
  return points.map(([x, y]) => [1 - (origin[0] + x * size), origin[1] + y * size])
}

describe('monter et descendre', () => {
  it('reconnaît une main qui monte', () => {
    const s = track(line([0.5, 0.7], [0.5, 0.4], 15))
    expect(detectMotion(s, { kind: 'up' }, now(s))).toBe(true)
    expect(detectMotion(s, { kind: 'down' }, now(s))).toBe(false)
  })

  it('reconnaît une main qui descend', () => {
    const s = track(line([0.5, 0.3], [0.5, 0.6], 15))
    expect(detectMotion(s, { kind: 'down' }, now(s))).toBe(true)
    expect(detectMotion(s, { kind: 'up' }, now(s))).toBe(false)
  })

  it('ignore une main immobile ou qui tremble', () => {
    const s = track(Array.from({ length: 20 }, (_, i) => [0.5 + (i % 2) * 0.004, 0.5 + (i % 3) * 0.003]))
    expect(detectMotion(s, { kind: 'up' }, now(s))).toBe(false)
    expect(detectMotion(s, { kind: 'down' }, now(s))).toBe(false)
  })

  it('ignore un mouvement surtout horizontal', () => {
    const s = track(line([0.2, 0.55], [0.6, 0.45], 15))
    expect(detectMotion(s, { kind: 'up' }, now(s))).toBe(false)
  })

  it('ignore un mouvement trop ancien', () => {
    const s = track(line([0.5, 0.7], [0.5, 0.4], 15))
    expect(detectMotion(s, { kind: 'up' }, now(s) + 3000)).toBe(false)
  })
})

describe('glissement vers le bas', () => {
  it('reconnaît un court glissement que « descendre » ne voit pas', () => {
    // 0,09 d'image = 0,6 fois la taille de la main : plus que le seuil du glissement (0,4), moins que celui de « descendre » (0,7).
    const s = track(line([0.55, 0.4], [0.52, 0.49], 12))
    expect(detectMotion(s, { kind: 'slide-down' }, now(s))).toBe(true)
    expect(detectMotion(s, { kind: 'down' }, now(s))).toBe(false)
  })

  it('reconnaît aussi un glissement plus long', () => {
    const s = track(line([0.55, 0.3], [0.5, 0.5], 12))
    expect(detectMotion(s, { kind: 'slide-down' }, now(s))).toBe(true)
  })

  it('ignore une main immobile et un mouvement vers le haut', () => {
    const still = track(Array.from({ length: 12 }, () => [0.5, 0.45] as [number, number]))
    expect(detectMotion(still, { kind: 'slide-down' }, now(still))).toBe(false)
    const up = track(line([0.5, 0.55], [0.5, 0.4], 12))
    expect(detectMotion(up, { kind: 'slide-down' }, now(up))).toBe(false)
  })

  it('ignore un glissement surtout horizontal', () => {
    const s = track(line([0.3, 0.44], [0.6, 0.5], 12))
    expect(detectMotion(s, { kind: 'slide-down' }, now(s))).toBe(false)
  })
})

describe('deux mains qui se rapprochent', () => {
  it('reconnaît le rapprochement', () => {
    const s: Sample[] = Array.from({ length: 15 }, (_, i) => {
      const gap = 0.5 - 0.4 * (i / 14)
      return { t: i * FRAME_MS, hands: [hand(0.5 - gap / 2, 0.5), hand(0.5 + gap / 2, 0.5)] }
    })
    expect(detectMotion(s, { kind: 'together' }, now(s))).toBe(true)
  })

  it("ignore deux mains qui s'écartent", () => {
    const s: Sample[] = Array.from({ length: 15 }, (_, i) => {
      const gap = 0.1 + 0.4 * (i / 14)
      return { t: i * FRAME_MS, hands: [hand(0.5 - gap / 2, 0.5), hand(0.5 + gap / 2, 0.5)] }
    })
    expect(detectMotion(s, { kind: 'together' }, now(s))).toBe(false)
  })

  it('ignore une seule main', () => {
    const s = track(line([0.3, 0.5], [0.5, 0.5], 15))
    expect(detectMotion(s, { kind: 'together' }, now(s))).toBe(false)
  })
})

describe('main qui pivote vers le bas', () => {
  it('reconnaît des doigts qui passent de horizontal à vers le bas', () => {
    const s: Sample[] = Array.from({ length: 15 }, (_, i) => {
      const angle = (i / 14) * (Math.PI / 2) // 0 = à l'horizontale, π/2 = vers le bas
      return {
        t: i * FRAME_MS,
        hands: [hand(0.5, 0.5, { tipX: 0.5 + Math.cos(angle) * SCALE, tipY: 0.5 + Math.sin(angle) * SCALE })],
      }
    })
    expect(detectMotion(s, { kind: 'pivot-down' }, now(s))).toBe(true)
  })

  it('ignore une main qui reste horizontale', () => {
    const s: Sample[] = Array.from({ length: 15 }, (_, i) => ({
      t: i * FRAME_MS,
      hands: [hand(0.5, 0.5, { tipX: 0.5 + SCALE, tipY: 0.5 })],
    }))
    expect(detectMotion(s, { kind: 'pivot-down' }, now(s))).toBe(false)
  })
})

describe('main qui avance vers la caméra', () => {
  /** La taille apparente de la main évolue de `from` à `to`. */
  const growing = (from: number, to: number): Sample[] =>
    Array.from({ length: 15 }, (_, i) => ({
      t: i * FRAME_MS,
      hands: [hand(0.5, 0.5, { scale: from + ((to - from) * i) / 14 })],
    }))

  it("reconnaît une main qui s'agrandit", () => {
    const s = growing(0.12, 0.18)
    expect(detectMotion(s, { kind: 'forward' }, now(s))).toBe(true)
  })

  it('ignore une main à distance constante', () => {
    const s = growing(0.15, 0.155)
    expect(detectMotion(s, { kind: 'forward' }, now(s))).toBe(false)
  })

  it('ignore une main qui recule', () => {
    const s = growing(0.18, 0.12)
    expect(detectMotion(s, { kind: 'forward' }, now(s))).toBe(false)
  })
})

describe('main qui se balance', () => {
  /** Le bout des doigts oscille horizontalement : `swings` demi-tours d'amplitude `amplitude`. */
  const waving = (swings: number, amplitude: number): Sample[] =>
    Array.from({ length: 24 }, (_, i) => ({
      t: i * FRAME_MS,
      hands: [hand(0.5, 0.5, { tipX: 0.5 + amplitude * Math.sin((i / 23) * swings * Math.PI) })],
    }))

  it('reconnaît un salut de la main', () => {
    const s = waving(4, 0.15)
    expect(detectMotion(s, { kind: 'wave' }, now(s))).toBe(true)
  })

  it('ignore une main immobile', () => {
    const s = waving(4, 0)
    expect(detectMotion(s, { kind: 'wave' }, now(s))).toBe(false)
  })

  it("ignore un simple déplacement dans un seul sens", () => {
    const s = waving(1, 0.15)
    expect(detectMotion(s, { kind: 'wave' }, now(s))).toBe(false)
  })

  it('ignore un tremblement trop petit', () => {
    const s = waving(6, 0.02)
    expect(detectMotion(s, { kind: 'wave' }, now(s))).toBe(false)
  })
})

describe('trajectoires dessinées', () => {
  const Z: [number, number][] = [
    ...line([0, 0], [1, 0], 8),
    ...line([1, 0], [0, 1], 10),
    ...line([0, 1], [1, 1], 8),
  ]

  it('resample rend le nombre de points demandé', () => {
    expect(resample(line([0, 0], [1, 1], 5).map(([x, y]) => ({ x, y })), 32)).toHaveLength(32)
  })

  it('reconnaît un Z tracé dans le miroir', () => {
    const s = track(userPath(Z, 0.4, [0.3, 0.3]))
    expect(detectMotion(s, { kind: 'path', path: 'z' }, now(s))).toBe(true)
  })

  it("reconnaît un Z précédé d'un déplacement parasite", () => {
    const lead = line([0.8, 0.8], [0.7, 0.35], 10)
    const s = track([...lead, ...userPath(Z, 0.4, [0.3, 0.3])])
    expect(detectMotion(s, { kind: 'path', path: 'z' }, now(s))).toBe(true)
  })

  it('ne prend pas une ligne droite pour un Z', () => {
    const s = track(userPath(line([0, 0], [1, 1], 20), 0.4, [0.3, 0.3]))
    expect(detectMotion(s, { kind: 'path', path: 'z' }, now(s))).toBe(false)
  })

  it('ne prend pas un cercle pour un Z', () => {
    const circle = Array.from({ length: 30 }, (_, i): [number, number] => [
      0.5 + 0.5 * Math.cos((i / 29) * 2 * Math.PI),
      0.5 + 0.5 * Math.sin((i / 29) * 2 * Math.PI),
    ])
    const s = track(userPath(circle, 0.4, [0.3, 0.3]))
    expect(detectMotion(s, { kind: 'path', path: 'z' }, now(s))).toBe(false)
  })

  it('ignore un tracé trop petit pour la taille de la main', () => {
    const s = track(userPath(Z, 0.05, [0.4, 0.4]))
    expect(detectMotion(s, { kind: 'path', path: 'z' }, now(s))).toBe(false)
  })

  it('le modèle du Z est proche de lui-même', () => {
    expect(pathDistance(Z.map(([x, y]) => ({ x, y })), 'z')).toBeLessThan(0.05)
  })

  it('reconnaît un J : on descend puis on incurve vers la gauche', () => {
    const J: [number, number][] = [
      ...line([0.8, 0], [0.8, 0.6], 10),
      ...line([0.8, 0.6], [0.5, 1], 6),
      ...line([0.5, 1], [0.15, 0.65], 6),
    ]
    const s = track(userPath(J, 0.4, [0.3, 0.3]))
    expect(detectMotion(s, { kind: 'path', path: 'j' }, now(s))).toBe(true)
  })
})
