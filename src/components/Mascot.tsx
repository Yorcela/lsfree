import type { ReactNode } from 'react'

/** Expressions de la mascotte : une image par humeur dans public/mascot/. */
export type Mood = 'heureux' | 'fier' | 'triste' | 'decourage' | 'decu' | 'inquiet' | 'anxieux' | 'amoureux'

/** La mascotte parle dans une bulle : elle dit quel signe faire et réagit à ce que fait l'élève. */
export function Mascot({ mood, children }: { mood: Mood; children: ReactNode }) {
  return (
    <div className="mascot">
      <img className="mascot-img" src={`./mascot/${mood}.png`} alt="" />
      <div className="bubble" role="status">
        {children}
      </div>
    </div>
  )
}
