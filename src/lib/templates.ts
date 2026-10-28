import type { HandShape } from './landmarks'

export interface Sign {
  id: string
  label: string
  /** Description textuelle du signe, en attendant les images de référence. */
  hint: string
}

/** Premiers signes : configurations de la main de l'alphabet manuel. */
export const SIGNS: Sign[] = [
  { id: 'a', label: 'A', hint: 'Poing fermé, pouce tendu sur le côté.' },
  { id: 'b', label: 'B', hint: 'Main ouverte, doigts serrés et tendus, pouce replié sur la paume.' },
  { id: 'l', label: 'L', hint: 'Index et pouce tendus à angle droit, autres doigts repliés.' },
  { id: 'y', label: 'Y', hint: 'Pouce et auriculaire tendus, autres doigts repliés.' },
]

const STORAGE_KEY = 'lsfree.templates'

export function loadTemplates(): Record<string, HandShape> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveTemplate(id: string, shape: HandShape): Record<string, HandShape> {
  const all = { ...loadTemplates(), [id]: shape }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // stockage indisponible : le modèle reste valable pour la session via le state
  }
  return all
}
