import type { CSSProperties } from 'react'
import { spriteForFingers, type Sign, type Spot } from '../lib/signs'

/** Où se trouve la main sur la mascotte, en pourcentage de la largeur et de la hauteur de son image. */
const SPOTS: Record<Spot, [number, number]> = {
  forehead: [50, 14],
  mouth: [50, 34],
  chin: [50, 42],
  cheek: [72, 30],
  chest: [50, 66],
  front: [88, 56],
}

/** Taille de la main (par rapport à sa taille normale) : petite au départ, plus grande quand elle s'avance. */
const SMALL = 0.8
const BIG = 1.2

/**
 * Schéma animé d'un mot : la mascotte, avec sa main robot qui rejoue le geste en boucle. Elle remplace une photo pour
 * les mots, où la place de la main sur le visage compte (la caméra, elle, ne voit que la main).
 */
export function SignDiagram({ sign }: { sign: Sign }) {
  const d = sign.diagram
  if (!d) return null

  const file = spriteForFingers(d.hand) ?? 'b'
  const from = SPOTS[d.from]
  const to = SPOTS[d.to ?? d.from]
  const style = {
    '--fx': `${from[0]}%`,
    '--fy': `${from[1]}%`,
    '--tx': `${to[0]}%`,
    '--ty': `${to[1]}%`,
    '--fs': SMALL,
    '--ts': d.grow ? BIG : SMALL,
  } as CSSProperties

  return (
    <div className="mascot-diagram" role="img" aria-label={`Schéma du signe « ${sign.label} »`}>
      <img className="mascot-diagram-body" src="./mascot/heureux.png" alt="" />
      <img className={d.wave ? 'diagram-hand wave' : 'diagram-hand travel'} src={`./hands/${file}.png`} alt="" style={style} />
    </div>
  )
}
