import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

// Main « hologramme » : remplissage bleu-vert sombre, contour cyan lumineux.
const FILL = '#0e5069'
const OUTLINE = '#6ef3ff'
const OUTLINE_EXTRA = 8

/** Chaînes de points de chaque doigt, de la base vers le bout, avec leur épaisseur relative. */
const FINGERS: { points: number[]; width: number }[] = [
  { points: [1, 2, 3, 4], width: 0.3 },
  { points: [5, 6, 7, 8], width: 0.26 },
  { points: [9, 10, 11, 12], width: 0.26 },
  { points: [13, 14, 15, 16], width: 0.25 },
  { points: [17, 18, 19, 20], width: 0.22 },
]
const PALM = [0, 1, 5, 9, 13, 17]

/**
 * Dessine une main « numérique » pleine (paume et doigts arrondis) à partir des 21 points.
 * Le contour est tracé d'abord pour toutes les formes, puis le remplissage : les formes fusionnent proprement.
 */
export function drawHand(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], width: number, height: number) {
  const px = landmarks.map((p) => ({ x: p.x * width, y: p.y * height }))
  const palmWidth = Math.hypot(px[5].x - px[17].x, px[5].y - px[17].y)

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const paint = (color: string, extra: number) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color

    ctx.beginPath()
    PALM.forEach((i, n) => (n === 0 ? ctx.moveTo(px[i].x, px[i].y) : ctx.lineTo(px[i].x, px[i].y)))
    ctx.closePath()
    ctx.lineWidth = palmWidth * 0.3 + extra
    ctx.fill()
    ctx.stroke()

    for (const finger of FINGERS) {
      ctx.beginPath()
      finger.points.forEach((i, n) => (n === 0 ? ctx.moveTo(px[i].x, px[i].y) : ctx.lineTo(px[i].x, px[i].y)))
      ctx.lineWidth = palmWidth * finger.width + extra
      ctx.stroke()
    }
  }

  paint(OUTLINE, OUTLINE_EXTRA)
  paint(FILL, 0)
  ctx.restore()
}
