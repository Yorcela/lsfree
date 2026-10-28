import type { FingerValues } from './landmarks'
import type { Sign } from './signs'

const FLAT: FingerValues = [0.5, 1, 1, 1, 1]
const OPEN: FingerValues = [0.8, 1, 1, 1, 1]
const POINT: FingerValues = [0.1, 1, 0, 0, 0]

/**
 * Mots de la vie de tous les jours. Les descriptions viennent de ressources publiques qui ne s'accordent pas
 * toujours : le signe varie selon les régions et les personnes, à confirmer avec une personne sourde.
 * La caméra ne voit que la main, pas le visage : elle vérifie la forme de la main et le mouvement, pas l'endroit.
 */
export const GREETINGS: Sign[] = [
  {
    id: 'bonjour',
    label: 'Bonjour',
    hint: "Main à plat, paume vers l'avant, qui s'avance vers l'avant, avec un sourire.",
    fingers: FLAT,
    ignore: [0],
    motion: true,
    move: { kind: 'forward' },
    diagram: { hand: FLAT, from: 'front', grow: true },
  },
  {
    id: 'svp',
    label: "S'il vous plaît",
    hint: "Main à plat qui glisse le long de la joue jusqu'au coin de la bouche (le signe varie : certains le font près de l'oreille).",
    fingers: FLAT,
    ignore: [0],
    motion: true,
    move: { kind: 'slide-down' },
    diagram: { hand: FLAT, from: 'cheek', to: 'mouth' },
  },
  {
    id: 'merci',
    label: 'Merci',
    hint: "Main à plat près des lèvres, qui s'éloigne vers l'avant comme pour envoyer un baiser.",
    fingers: FLAT,
    ignore: [0],
    motion: true,
    move: { kind: 'forward' },
    diagram: { hand: FLAT, from: 'mouth', to: 'front', grow: true },
  },
  {
    id: 'aurevoir',
    label: 'Au revoir',
    hint: 'Main ouverte, qui se balance de gauche à droite comme un petit salut.',
    fingers: OPEN,
    ignore: [0],
    motion: true,
    move: { kind: 'wave' },
    diagram: { hand: OPEN, from: 'front', wave: true },
  },
]

/** « Je » : l'index se pointe vers soi. Il ouvre la phrase « je m'appelle », suivie du prénom épelé. */
export const ME: Sign = {
  id: 'je',
  label: 'Je',
  hint: "L'index se pointe vers ta poitrine : c'est « moi », « je ».",
  fingers: POINT,
  motion: true,
  diagram: { hand: POINT, from: 'front', to: 'chest' },
}
