export interface Point {
  x: number
  y: number
  z: number
}

/** 21 points de la main, normalisés : poignet à l'origine, échelle = poignet → base du majeur, main gauche en miroir. */
export type HandShape = Point[]

const WRIST = 0
const MIDDLE_MCP = 9

export function normalize(landmarks: Point[], handedness: 'Left' | 'Right'): HandShape {
  const wrist = landmarks[WRIST]
  const ref = landmarks[MIDDLE_MCP]
  const scale = Math.hypot(ref.x - wrist.x, ref.y - wrist.y, ref.z - wrist.z) || 1
  const flip = handedness === 'Left' ? -1 : 1
  return landmarks.map((p) => ({
    x: (flip * (p.x - wrist.x)) / scale,
    y: (p.y - wrist.y) / scale,
    z: (p.z - wrist.z) / scale,
  }))
}

/** Distance moyenne entre deux formes de main (0 = identiques). */
export function distance(a: HandShape, b: HandShape): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y, a[i].z - b[i].z)
  }
  return sum / a.length
}

/** Distance à partir de laquelle le score tombe à 0. */
const MAX_DISTANCE = 0.6

export function score(a: HandShape, b: HandShape): number {
  return Math.max(0, 1 - distance(a, b) / MAX_DISTANCE)
}
