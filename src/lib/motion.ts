import type { Point } from './landmarks'

/** Mouvement attendu pour un signe. */
export type MotionSpec =
  | { kind: 'up' | 'down' | 'slide-down' | 'together' | 'tap-twice' | 'pivot-down' | 'forward' | 'wave' | 'any' }
  | { kind: 'path'; path: 'z' | 'j' }

/** Repères d'une main sur une image, en coordonnées de l'image (0 à 1, non retournées). */
export interface HandPoint {
  /** Paume (base du majeur). */
  x: number
  y: number
  /** Taille de la main : distance poignet → paume, sert d'unité pour les mouvements. */
  scale: number
  /** Bout du majeur. */
  tipX: number
  tipY: number
  /** Poignet : avec la paume, il donne l'axe de la main, même quand les doigts sont repliés. */
  wristX: number
  wristY: number
  /** Bout de l'index (le Z se dessine avec lui). */
  indexX: number
  indexY: number
  /** Bout de l'auriculaire (le J se dessine avec lui). */
  pinkyX: number
  pinkyY: number
}

export interface Sample {
  t: number
  hands: HandPoint[]
}

/** Durée de trajectoire gardée en mémoire. */
export const WINDOW_MS = 2500

export function toHandPoint(landmarks: Point[]): HandPoint {
  const palm = landmarks[9]
  const wrist = landmarks[0]
  const tip = landmarks[12]
  const index = landmarks[8]
  const pinky = landmarks[20]
  return {
    x: palm.x,
    y: palm.y,
    scale: Math.hypot(palm.x - wrist.x, palm.y - wrist.y) || 0.05,
    tipX: tip.x,
    tipY: tip.y,
    wristX: wrist.x,
    wristY: wrist.y,
    indexX: index.x,
    indexY: index.y,
    pinkyX: pinky.x,
    pinkyY: pinky.y,
  }
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / (values.length || 1)

/** Au moins ce nombre d'images est nécessaire pour juger un mouvement. */
const MIN_SAMPLES = 5

interface P {
  x: number
  y: number
}

const TEMPLATES: Record<'z' | 'j', P[]> = {
  z: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  // Un J : on descend, puis la trajectoire s'incurve vers la gauche.
  j: [
    { x: 0.8, y: 0 },
    { x: 0.8, y: 0.6 },
    { x: 0.7, y: 0.85 },
    { x: 0.5, y: 1 },
    { x: 0.3, y: 0.9 },
    { x: 0.15, y: 0.65 },
  ],
}

const PATH_POINTS = 32
/** Écart moyen maximal (dans un carré de côté 1) entre la trajectoire et le modèle. */
const PATH_MAX_DISTANCE = 0.26

function pathLength(points: P[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  return total
}

/** Redécoupe une ligne brisée en n points régulièrement espacés le long de la ligne. */
export function resample(points: P[], n: number): P[] {
  const total = pathLength(points)
  if (total === 0) return Array.from({ length: n }, () => ({ ...points[0] }))
  const step = total / (n - 1)
  const result: P[] = [points[0]]
  let carried = 0
  for (let i = 1; i < points.length && result.length < n; i++) {
    let a = points[i - 1]
    const b = points[i]
    let segment = Math.hypot(b.x - a.x, b.y - a.y)
    while (carried + segment >= step && result.length < n) {
      const ratio = (step - carried) / segment
      a = { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio }
      result.push(a)
      segment = Math.hypot(b.x - a.x, b.y - a.y)
      carried = 0
    }
    carried += segment
  }
  while (result.length < n) result.push(points[points.length - 1])
  return result
}

/** Ramène la trajectoire dans un carré de côté 1. */
function toUnitSquare(points: P[]): P[] {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const width = Math.max(...xs) - minX || 1
  const height = Math.max(...ys) - minY || 1
  return points.map((p) => ({ x: (p.x - minX) / width, y: (p.y - minY) / height }))
}

/** Écart moyen entre une trajectoire et le modèle d'une forme (0 = identique). */
export function pathDistance(points: P[], path: 'z' | 'j'): number {
  const a = toUnitSquare(resample(points, PATH_POINTS))
  const b = resample(TEMPLATES[path], PATH_POINTS)
  return mean(a.map((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y)))
}

function detectPath(samples: Sample[], path: 'z' | 'j'): boolean {
  const usable = samples.filter((s) => s.hands.length >= 1)
  if (usable.length < 12) return false
  // L'image de la caméra est un miroir de ce que voit l'élève : on retourne l'axe horizontal.
  // On suit le bout du doigt qui dessine : l'index pour le Z, l'auriculaire pour le J (il suit aussi la main entière).
  const tip = (h: HandPoint) => (path === 'z' ? { x: h.indexX, y: h.indexY } : { x: h.pinkyX, y: h.pinkyY })
  const points = usable.map((s) => {
    const p = tip(s.hands[0])
    return { x: 1 - p.x, y: p.y }
  })
  const scale = mean(usable.map((s) => s.hands[0].scale))

  // La trajectoire peut commencer avant le geste : on essaie plusieurs départs, jusqu'à la dernière image.
  const step = Math.max(1, Math.floor(points.length / 6))
  for (let start = 0; start <= points.length - 12; start += step) {
    const window = points.slice(start)
    const xs = window.map((p) => p.x)
    const ys = window.map((p) => p.y)
    const width = Math.max(...xs) - Math.min(...xs)
    const height = Math.max(...ys) - Math.min(...ys)
    // Le geste doit être ample par rapport à la taille de la main.
    if (height < 0.9 * scale || (path === 'z' && width < 0.9 * scale)) continue
    if (pathDistance(window, path) <= PATH_MAX_DISTANCE) return true
  }
  return false
}

/**
 * Nombre de fois où les deux mains se sont rapprochées l'une de l'autre : elles sont écartées (au moins une fois et
 * demie la taille d'une main), puis se touchent presque. Chaque rapprochement, suivi d'un écart, en compte un.
 */
export function countApproaches(samples: Sample[]): number {
  const s = samples.filter((x) => x.hands.length === 2)
  if (s.length < MIN_SAMPLES) return 0
  const scale = mean(s.map((x) => mean(x.hands.map((h) => h.scale))))
  const gaps = s.map((x) => Math.hypot(x.hands[0].x - x.hands[1].x, x.hands[0].y - x.hands[1].y))
  const apart = 1.5 * scale
  const near = 0.8 * scale
  let count = 0
  let state: 'unknown' | 'apart' | 'near' = 'unknown'
  for (const gap of gaps) {
    if (gap >= apart) state = 'apart'
    else if (gap <= near && state === 'apart') {
      count++
      state = 'near'
    }
  }
  return count
}

/** Dit si le mouvement demandé vient d'être exécuté, d'après les dernières images. `now` est l'heure courante en ms. */
export function detectMotion(samples: Sample[], spec: MotionSpec, now: number): boolean {
  const recent = (ms: number) => samples.filter((s) => now - s.t <= ms)

  switch (spec.kind) {
    case 'up':
    case 'down':
    case 'slide-down': {
      const s = recent(1000).filter((x) => x.hands.length >= 1)
      if (s.length < MIN_SAMPLES) return false
      const ys = s.map((x) => mean(x.hands.map((h) => h.y)))
      const xs = s.map((x) => mean(x.hands.map((h) => h.x)))
      // Un glissement (le long de la joue) est plus court qu'un vrai déplacement vers le haut ou le bas.
      const distance = spec.kind === 'slide-down' ? 0.4 : 0.7
      const threshold = distance * mean(s.map((x) => mean(x.hands.map((h) => h.scale))))
      // L'axe y de l'image va vers le bas : monter = y diminue. On garde le point de départ le plus bas (ou le plus haut).
      const sign = spec.kind === 'up' ? 1 : -1 // « down » et « slide-down » descendent
      let start = { y: ys[0], x: xs[0] }
      for (let j = 1; j < s.length; j++) {
        const travelled = sign * (start.y - ys[j])
        if (travelled >= threshold && Math.abs(xs[j] - start.x) <= travelled) return true
        if (-sign * ys[j] < -sign * start.y) start = { y: ys[j], x: xs[j] }
      }
      return false
    }

    case 'together':
      return countApproaches(recent(1200)) >= 1

    case 'tap-twice':
      return countApproaches(recent(2500)) >= 2

    case 'any': {
      // Un signe dont la trajectoire exacte n'est pas connue : un déplacement net de la main suffit.
      const s = recent(1000).filter((x) => x.hands.length >= 1)
      if (s.length < MIN_SAMPLES) return false
      const scales = s.map((x) => x.hands[0].scale)
      const scale = mean(scales)
      let farthest = 0
      for (const a of s) {
        for (const b of s) {
          farthest = Math.max(farthest, Math.hypot(a.hands[0].x - b.hands[0].x, a.hands[0].y - b.hands[0].y))
        }
      }
      return farthest >= 0.5 * scale || Math.max(...scales) / Math.min(...scales) >= 1.2
    }

    case 'pivot-down': {
      const s = recent(1500).filter((x) => x.hands.length >= 1)
      if (s.length < MIN_SAMPLES) return false
      // Axe de la main, du poignet vers la paume : 1 = vers le haut, -1 = vers le bas. On n'utilise pas le bout du
      // majeur, car il est replié quand seul l'index pointe.
      const upness = s.map((x) => {
        const h = x.hands[0]
        return -(h.y - h.wristY) / (Math.hypot(h.x - h.wristX, h.y - h.wristY) || 1)
      })
      let highest = upness[0]
      for (let j = 1; j < upness.length; j++) {
        if (highest - upness[j] >= 0.6 && upness[j] <= -0.25) return true
        highest = Math.max(highest, upness[j])
      }
      return false
    }

    case 'forward': {
      // Une main qui s'avance vers la caméra paraît plus grande : sa taille augmente nettement.
      const s = recent(1000).filter((x) => x.hands.length >= 1)
      if (s.length < MIN_SAMPLES) return false
      let smallest = s[0].hands[0].scale
      for (const sample of s) {
        const scale = sample.hands[0].scale
        if (scale >= 1.25 * smallest) return true
        smallest = Math.min(smallest, scale)
      }
      return false
    }

    case 'wave': {
      // Une main qui se balance : le bout des doigts va et vient horizontalement, au moins trois demi-tours.
      const s = recent(1500).filter((x) => x.hands.length >= 1)
      if (s.length < 8) return false
      const xs = s.map((x) => x.hands[0].tipX)
      const threshold = 0.6 * mean(s.map((x) => x.hands[0].scale))
      let low = xs[0]
      let high = xs[0]
      let direction = 0
      let swings = 0
      for (const x of xs) {
        low = Math.min(low, x)
        high = Math.max(high, x)
        if (direction !== 1 && x - low >= threshold) {
          direction = 1
          swings++
          high = x
        } else if (direction !== -1 && high - x >= threshold) {
          direction = -1
          swings++
          low = x
        }
      }
      return swings >= 3
    }

    case 'path':
      return detectPath(recent(WINDOW_MS), spec.path)
  }
}
