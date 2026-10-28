import type { Sign } from './signs'

export type Outcome = 'ok' | 'hint' | 'skipped'

export interface Answer {
  sign: Sign
  outcome: Outcome
}

/**
 * Étoiles de l'interro : 3 si presque tout est réussi seul, 2 si environ la moitié, 1 si au moins un cinquième,
 * 0 sinon. Un indice compte pour une demi-réussite, un signe passé pour rien : on ne peut donc pas gagner d'étoile
 * (ni débloquer le quiz de l'alphabet) en passant toutes les questions.
 */
export function starsFor(answers: Answer[]): number {
  if (answers.length === 0) return 0
  const points = answers.reduce((sum, a) => sum + (a.outcome === 'ok' ? 1 : a.outcome === 'hint' ? 0.5 : 0), 0)
  const ratio = points / answers.length
  if (ratio >= 0.9) return 3
  if (ratio >= 0.5) return 2
  if (ratio >= 0.2) return 1
  return 0
}
