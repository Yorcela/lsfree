export interface Point {
  x: number
  y: number
  z: number
}

/** 21 points de la main, normalisés : poignet à l'origine, échelle = poignet → base du majeur, main gauche en miroir. */
export type HandShape = Point[]

/** Dépliement des 5 doigts, de 0 (replié) à 1 (tendu) : pouce, index, majeur, annulaire, auriculaire. */
export type FingerValues = [number, number, number, number, number]

const WRIST = 0
const THUMB_TIP = 4
const INDEX_MCP = 5
const INDEX_TIP = 8
const FINGER_TIPS = [8, 12, 16, 20]

export function normalize(landmarks: Point[], handedness: 'Left' | 'Right'): HandShape {
  const wrist = landmarks[WRIST]
  const ref = landmarks[9]
  const scale = Math.hypot(ref.x - wrist.x, ref.y - wrist.y, ref.z - wrist.z) || 1
  const flip = handedness === 'Left' ? -1 : 1
  return landmarks.map((p) => ({
    x: (flip * (p.x - wrist.x)) / scale,
    y: (p.y - wrist.y) / scale,
    z: (p.z - wrist.z) / scale,
  }))
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function fingerValues(shape: HandShape): FingerValues {
  // Pouce : écart entre son bout et la base de l'index. Autres doigts : distance bout → poignet.
  const thumb = clamp01((dist(shape[THUMB_TIP], shape[INDEX_MCP]) - 0.35) / 0.45)
  const others = FINGER_TIPS.map((tip) => clamp01((dist(shape[tip], shape[WRIST]) - 1.0) / 0.8))
  return [thumb, others[0], others[1], others[2], others[3]]
}

/** Écart entre le bout du pouce et celui de l'index (petit = les deux se touchent). */
export function pinchDistance(shape: HandShape): number {
  return dist(shape[THUMB_TIP], shape[INDEX_TIP])
}

export interface SignSpec {
  /** Dépliement attendu de chaque doigt. */
  fingers: FingerValues
  /** Pouce et index doivent se toucher. */
  pinch?: boolean
}

/** Éléments comparés, dans l'ordre : les 5 doigts puis le contact pouce-index. */
export const PARTS = ["le pouce", "l'index", 'le majeur', "l'annulaire", "l'auriculaire", 'le contact pouce-index'] as const

export interface Match {
  /** 1 = parfait, 0 = très différent. Le pire élément décide du score. */
  score: number
  /** Indice (dans PARTS) de l'élément le plus éloigné. */
  worst: number
  /** Ce que la caméra voit : dépliement de chaque doigt. */
  values: FingerValues
  /** Sens de la correction pour l'élément le plus éloigné. */
  direction: 'unfold' | 'fold' | 'touch'
}

export function matchSign(shape: HandShape, spec: SignSpec): Match {
  const values = fingerValues(shape)
  const diffs = values.map((v, i) => Math.abs(v - spec.fingers[i]))
  diffs.push(spec.pinch ? clamp01((pinchDistance(shape) - 0.3) / 0.4) : 0)

  let worst = 0
  diffs.forEach((d, i) => {
    if (d > diffs[worst]) worst = i
  })
  const direction = worst === 5 ? 'touch' : values[worst] < spec.fingers[worst] ? 'unfold' : 'fold'
  return { score: 1 - diffs[worst], worst, values, direction }
}
