import type { CSSProperties } from 'react'
import type { Sign, Spot } from '../lib/signs'
import { HandGlyph } from './HandIllustration'

/** Centre de la main à chaque endroit du corps, dans un schéma de 200 × 230. */
const SPOTS: Record<Spot, [number, number]> = {
  forehead: [100, 40],
  mouth: [100, 84],
  chin: [100, 104],
  cheek: [128, 70],
  chest: [100, 164],
  front: [158, 134],
}

const SMALL = 0.45
const BIG = 0.8

/** Place le dessin d'une main (100 × 130) pour que son centre tombe sur `spot`, à l'échelle `scale`. */
function place([x, y]: [number, number], scale: number): string {
  return `translate(${x - 50 * scale}px, ${y - 65 * scale}px) scale(${scale})`
}

/**
 * Schéma animé d'un signe : un buste simplifié (ce n'est pas le visage de l'élève, juste un repère) et la main
 * qui rejoue le geste en boucle. Remplace la photo pour les mots, où la place de la main sur le visage compte.
 */
export function SignDiagram({ sign }: { sign: Sign }) {
  const d = sign.diagram
  if (!d) return null

  const from = place(SPOTS[d.from], SMALL)
  const to = place(SPOTS[d.to ?? d.from], d.grow ? BIG : SMALL)

  return (
    <svg className="diagram" viewBox="0 0 200 230" role="img" aria-label={`Schéma du signe « ${sign.label} »`}>
      <path className="body" d="M14 230 Q22 146 100 138 Q178 146 186 230 Z" />
      <rect className="body" x="88" y="96" width="24" height="46" rx="10" />
      <circle className="body" cx="100" cy="62" r="38" />
      <circle className="eye" cx="87" cy="58" r="3" />
      <circle className="eye" cx="113" cy="58" r="3" />
      <path className="mouth" d="M91 78 Q100 85 109 78" />
      {d.wave ? (
        <g style={{ transform: from }}>
          <g className="wave">
            <g className="hand-svg">
              <HandGlyph fingers={d.hand} />
            </g>
          </g>
        </g>
      ) : (
        <g className="travel" style={{ '--from': from, '--to': to } as CSSProperties}>
          <g className="hand-svg">
            <HandGlyph fingers={d.hand} />
          </g>
        </g>
      )}
    </svg>
  )
}
