import type { Sign } from '../lib/signs'

/** Flèches de mouvement dessinées à côté de la main : J, P et Z ne se font pas à l'arrêt. */
const MOTION_ARROWS: Record<string, string> = {
  j: 'M16 6 V44 Q16 62 40 62', // la main pivote : on descend puis on courbe
  p: 'M30 6 V62', // la main hoche vers le bas
  z: 'M8 8 H46 L8 42 H46', // un Z tracé dans l'air
}

/** La main robot d'une lettre, avec sa flèche de mouvement quand il y en a une. */
export function HandSprite({ sign }: { sign: Sign }) {
  const arrow = MOTION_ARROWS[sign.id]
  return (
    <div className="sprite">
      <img className="sprite-img" src={`./hands/${sign.id}.png`} alt={`Signe de la lettre ${sign.label}`} />
      {arrow && (
        <svg className="sprite-arrow" viewBox="0 0 54 70" role="img" aria-label="Sens du mouvement">
          <defs>
            <marker id="arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="arrow-head" />
            </marker>
          </defs>
          <path d={arrow} markerEnd="url(#arrow-head)" />
        </svg>
      )}
    </div>
  )
}
