export interface Point {
  x: number
  y: number
  z: number
}

/** 21 points de la main, normalisés : poignet à l'origine, échelle = poignet → base du majeur, main gauche en miroir. */
export type HandShape = Point[]

/** Dépliement des 5 doigts, de 0 (replié) à 1 (tendu) : pouce, index, majeur, annulaire, auriculaire. */
export type FingerValues = [number, number, number, number, number]

export type Orientation = 'up' | 'side' | 'down'

const WRIST = 0
const THUMB_TIP = 4
/** Repères de la paume : poignet et base des quatre doigts. Leur moyenne donne le centre de la paume. */
const PALM = [0, 5, 9, 13, 17]
const INDEX_TIP = 8
const MIDDLE_MCP = 9
const MIDDLE_TIP = 12
/** Les quatre doigts, de la base (MCP) au bout : index, majeur, annulaire, auriculaire. */
const FINGER_CHAINS = [
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
]

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

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function palmCenter(shape: HandShape): Point {
  const sum = PALM.reduce((s, i) => ({ x: s.x + shape[i].x, y: s.y + shape[i].y, z: s.z + shape[i].z }), { x: 0, y: 0, z: 0 })
  return { x: sum.x / PALM.length, y: sum.y / PALM.length, z: sum.z / PALM.length }
}

/**
 * Rectitude d'un doigt : distance base → bout divisée par la longueur de ses trois os. Un doigt tendu vaut environ 1,
 * un doigt replié nettement moins, et la mesure est la même pour l'auriculaire (court) que pour le majeur (long).
 */
function straightness(shape: HandShape, chain: number[]): number {
  const [mcp, pip, dip, tip] = chain
  const length = dist(shape[mcp], shape[pip]) + dist(shape[pip], shape[dip]) + dist(shape[dip], shape[tip])
  return length > 0 ? dist(shape[mcp], shape[tip]) / length : 0
}

export function fingerValues(shape: HandShape): FingerValues {
  // Pouce : éloignement de son bout par rapport au centre de la paume (replié en travers de la paume = proche,
  // quel que soit l'angle de la main). Autres doigts : rectitude, de 0,5 (replié) à 0,95 (tendu).
  const thumb = clamp01((dist(shape[THUMB_TIP], palmCenter(shape)) - 0.45) / 0.5)
  const others = FINGER_CHAINS.map((chain) => clamp01((straightness(shape, chain) - 0.5) / 0.45))
  return [thumb, others[0], others[1], others[2], others[3]]
}

/** Écart entre le bout du pouce et celui de l'index (petit = les deux se touchent). */
export function pinchDistance(shape: HandShape): number {
  return dist(shape[THUMB_TIP], shape[INDEX_TIP])
}

/** Écart entre les bouts de l'index et du majeur (petit = collés). */
export function spreadDistance(shape: HandShape): number {
  return dist(shape[INDEX_TIP], shape[MIDDLE_TIP])
}

/** Direction du poignet vers la base du majeur dans l'image : -1 = vers le bas, 1 = vers le haut. */
function upness(landmarks: Point[]): number {
  const dx = landmarks[MIDDLE_MCP].x - landmarks[WRIST].x
  const dy = landmarks[MIDDLE_MCP].y - landmarks[WRIST].y
  return -dy / (Math.hypot(dx, dy) || 1)
}

export interface SignSpec {
  /** Dépliement attendu de chaque doigt. */
  fingers: FingerValues
  /** true : pouce et index se touchent ; false : ils ne se touchent pas ; absent : sans importance. */
  pinch?: boolean
  /** Index et majeur collés (tight) ou écartés (wide) ; absent : sans importance. */
  spread?: 'tight' | 'wide'
  /** Direction de la main ; absent : sans importance. */
  orientation?: Orientation
  /** Signe à deux mains : ce que fait l'autre main (les deux mains sont montrées à la caméra). */
  second?: SignSpec
  /** Doigts qu'on ne compare pas (0 = pouce … 4 = auriculaire), quand leur position est trop ambiguë pour la caméra. */
  ignore?: number[]
}

/** Noms des doigts, dans l'ordre de FingerValues. */
export const PARTS = ['le pouce', "l'index", 'le majeur', "l'annulaire", "l'auriculaire"] as const

const ORIENTATION_ADVICE: Record<Orientation, string> = {
  up: 'Tiens la main droite, doigts vers le haut.',
  side: "Tourne la main à l'horizontale.",
  down: 'Dirige la main vers le bas.',
}

export interface Match {
  /** 1 = parfait, 0 = très différent. Le pire élément décide du score. */
  score: number
  /** Ce que la caméra voit : dépliement de chaque doigt. */
  values: FingerValues
  /** Conseil pour corriger l'élément le plus éloigné. */
  advice: string
}

export function matchSign(shape: HandShape, spec: SignSpec, landmarks: Point[]): Match {
  const values = fingerValues(shape)
  const candidates: { diff: number; advice: string }[] = values.flatMap((v, i) =>
    spec.ignore?.includes(i)
      ? []
      : [{ diff: Math.abs(v - spec.fingers[i]), advice: `${v < spec.fingers[i] ? 'Déplie' : 'Replie'} ${PARTS[i]}.` }],
  )

  if (spec.pinch !== undefined) {
    const p = pinchDistance(shape)
    candidates.push(
      spec.pinch
        ? { diff: clamp01((p - 0.3) / 0.4), advice: "Rapproche le pouce et l'index pour qu'ils se touchent." }
        : { diff: clamp01((0.5 - p) / 0.25), advice: "Écarte le pouce de l'index : ils ne doivent pas se toucher." },
    )
  }

  if (spec.spread) {
    const s = spreadDistance(shape)
    candidates.push(
      spec.spread === 'tight'
        ? { diff: clamp01((s - 0.3) / 0.25), advice: "Colle l'index et le majeur." }
        : { diff: clamp01((0.5 - s) / 0.25), advice: "Écarte l'index et le majeur." },
    )
  }

  if (spec.orientation) {
    const u = upness(landmarks)
    const diff =
      spec.orientation === 'up'
        ? clamp01((0.6 - u) / 0.3)
        : spec.orientation === 'down'
          ? clamp01((u + 0.35) / 0.3)
          : Math.max(clamp01((u - 0.5) / 0.3), clamp01((-0.2 - u) / 0.3))
    candidates.push({ diff, advice: ORIENTATION_ADVICE[spec.orientation] })
  }

  const worst = candidates.reduce((a, b) => (b.diff > a.diff ? b : a))
  return { score: 1 - worst.diff, values, advice: worst.advice }
}

export interface DetectedHand {
  shape: HandShape
  landmarks: Point[]
}

/** Compare le signe demandé aux mains vues par la caméra (au moins une). */
export function matchHands(hands: DetectedHand[], spec: SignSpec): Match {
  const single = (h: DetectedHand, s: SignSpec) => matchSign(h.shape, s, h.landmarks)

  if (!spec.second) {
    return hands.map((h) => single(h, spec)).reduce((a, b) => (b.score > a.score ? b : a))
  }

  if (hands.length < 2) {
    return { ...single(hands[0], spec), score: 0, advice: 'Ce signe se fait avec les deux mains : montre-les toutes les deux.' }
  }

  // On ne sait pas quelle main fait quoi : on essaie les deux affectations.
  const [a, b] = hands
  const options = [
    [single(a, spec), single(b, spec.second)],
    [single(b, spec), single(a, spec.second)],
  ]
  const best = options.reduce((x, y) => (Math.min(y[0].score, y[1].score) > Math.min(x[0].score, x[1].score) ? y : x))
  const worse = best[0].score <= best[1].score ? best[0] : best[1]
  return { score: worse.score, values: best[0].values, advice: worse.advice }
}
