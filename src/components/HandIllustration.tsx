import { spriteForFingers, type Sign } from '../lib/signs'

const FINGER_X = [38, 48.5, 59, 69.5]

/** Les formes d'une main vue de face (repère 100 × 130), à placer dans un <svg> ou un <g>. */
export function HandGlyph({ fingers, pinch }: { fingers: Sign['fingers']; pinch?: boolean }) {
  const [thumb, ...others] = fingers
  const thumbOut = thumb > 0.4
  return (
    <>
      {others.map((ext, i) => {
        const length = (14 + ext * 44) * (i === 3 ? 0.85 : 1)
        return <rect key={i} x={FINGER_X[i] - 4.5} y={72 - length} width={9} height={length + 8} rx={4.5} />
      })}
      <rect x={30} y={64} width={44} height={54} rx={14} />
      {thumbOut ? (
        <>
          <line className="thumb-outline" x1={34} y1={102} x2={34 - 18 * thumb} y2={102 - 40 * thumb} />
          <line className="thumb-fill" x1={34} y1={102} x2={34 - 18 * thumb} y2={102 - 40 * thumb} />
        </>
      ) : (
        <ellipse cx={46} cy={96} rx={11} ry={6} />
      )}
      {pinch && <circle className="pinch" cx={36} cy={50} r={10} />}
    </>
  )
}

/** Une main dessinée à partir du dépliement de chaque doigt. */
function Hand({ fingers, pinch }: { fingers: Sign['fingers']; pinch?: boolean }) {
  return (
    <svg className="hand-svg" viewBox="0 0 100 130" aria-hidden="true">
      <HandGlyph fingers={fingers} pinch={pinch} />
    </svg>
  )
}

/** Illustration d'un signe sans photo : une ou deux mains, avec le mouvement éventuel. */
export function HandIllustration({ sign }: { sign: Sign }) {
  const hands = sign.hands ?? []
  const arrow = sign.arrow
  return (
    <div className="sign-illustration" role="img" aria-label={`Signe du ${sign.label}`}>
      {hands.map((h, i) => (
        <span key={i} className="hand-slot">
          {/* La main robot quand on en a une pour cette forme, sinon le dessin simple. */}
          {!h.pinch && spriteForFingers(h.fingers) ? (
            <img className="hand-sprite" src={`./hands/${spriteForFingers(h.fingers)}.png`} alt="" />
          ) : (
            <Hand fingers={h.fingers} pinch={h.pinch} />
          )}
          {arrow === 'together' && i === 0 && <span className="arrow">→</span>}
          {arrow === 'together' && i === 1 && <span className="arrow">←</span>}
        </span>
      ))}
      {arrow === 'up' && <span className="arrow big">↑</span>}
      {arrow === 'down' && <span className="arrow big">↓</span>}
    </div>
  )
}
