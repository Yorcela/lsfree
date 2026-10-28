import type { SignSpec } from './landmarks'

export interface Sign extends SignSpec {
  id: string
  label: string
  /** Description du signe, utilisée comme indice. */
  hint: string
}

export const VOWELS: Sign[] = [
  { id: 'a', label: 'A', hint: 'Poing fermé, pouce tendu sur le côté.', fingers: [0.8, 0, 0, 0, 0] },
  { id: 'e', label: 'E', hint: 'Doigts repliés en griffe, pouce plié sous les doigts.', fingers: [0.1, 0.2, 0.2, 0.2, 0.2] },
  { id: 'i', label: 'I', hint: 'Poing fermé, auriculaire tendu.', fingers: [0, 0, 0, 0, 1] },
  { id: 'o', label: 'O', hint: 'Doigts arrondis, le pouce touche le bout des doigts pour former un « O ».', fingers: [0.5, 0.5, 0.5, 0.5, 0.5], pinch: true },
  { id: 'u', label: 'U', hint: 'Index et majeur tendus et collés, autres doigts repliés.', fingers: [0, 1, 1, 0, 0] },
  { id: 'y', label: 'Y', hint: 'Pouce et auriculaire tendus, les trois autres doigts repliés.', fingers: [0.8, 0, 0, 0, 1] },
]

/** Répétitions demandées pour chaque signe pendant l'apprentissage. */
export const REPETITIONS = 3
