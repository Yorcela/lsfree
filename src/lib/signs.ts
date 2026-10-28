import type { FingerValues, SignSpec } from './landmarks'
import type { MotionSpec } from './motion'

/** Une main dessinée dans une illustration. */
export interface HandDrawing {
  fingers: FingerValues
  pinch?: boolean
}

export interface Sign extends SignSpec {
  id: string
  label: string
  /** Description du signe, utilisée comme indice. */
  hint: string
  /** Signe qui comporte un mouvement : l'élève peut toujours le valider lui-même. */
  motion?: boolean
  /** Mouvement suivi par la caméra ; sans lui, seul le bouton de validation existe. */
  move?: MotionSpec
  /** La forme de la main n'est pas vérifiée : seul le mouvement compte. */
  ignoreShape?: boolean
  /** Mains à dessiner : présent pour les signes sans photo (chiffres et nombres). */
  hands?: HandDrawing[]
  /** Mouvement à montrer sur l'illustration. */
  arrow?: 'up' | 'down' | 'together'
}

export const VOWELS: Sign[] = [
  { id: 'a', label: 'A', hint: 'Poing fermé, pouce tendu sur le côté.', fingers: [0.8, 0, 0, 0, 0] },
  { id: 'e', label: 'E', hint: 'Doigts repliés en griffe, pouce plié sous les doigts.', fingers: [0.1, 0.35, 0.35, 0.35, 0.35] },
  { id: 'i', label: 'I', hint: 'Poing fermé, auriculaire tendu.', fingers: [0, 0, 0, 0, 1] },
  { id: 'o', label: 'O', hint: 'Doigts arrondis, le pouce touche le bout des doigts pour former un « O ».', fingers: [0.5, 0.5, 0.5, 0.5, 0.5], pinch: true },
  { id: 'u', label: 'U', hint: 'Index et majeur tendus et collés, autres doigts repliés.', fingers: [0, 1, 1, 0, 0], spread: 'tight' },
  { id: 'y', label: 'Y', hint: 'Pouce et auriculaire tendus, les trois autres doigts repliés.', fingers: [0.8, 0, 0, 0, 1] },
]

export const CONSONANTS: Sign[] = [
  { id: 'b', label: 'B', hint: 'Main ouverte et droite, doigts serrés et tendus vers le haut, pouce replié sur la paume.', fingers: [0.1, 1, 1, 1, 1], orientation: 'up' },
  { id: 'c', label: 'C', hint: 'Main en forme de « C » : doigts arrondis, pouce opposé aux doigts.', fingers: [0.6, 0.5, 0.5, 0.5, 0.5], pinch: false },
  { id: 'd', label: 'D', hint: 'Index tendu vers le haut, les autres doigts arrondis, le pouce touche le majeur.', fingers: [0.3, 1, 0.5, 0.5, 0.5] },
  { id: 'f', label: 'F', hint: "Le pouce et l'index se touchent en cercle, les trois autres doigts sont tendus et écartés.", fingers: [0.5, 0.5, 1, 1, 1], pinch: true },
  { id: 'g', label: 'G', hint: 'Index tendu vers le haut, les autres doigts et le pouce repliés.', fingers: [0.1, 1, 0, 0, 0] },
  { id: 'h', label: 'H', hint: 'Index et auriculaire tendus, majeur et annulaire repliés.', fingers: [0.1, 1, 0, 0, 1] },
  { id: 'j', label: 'J', hint: 'Suis les flèches de la photo : la main trace un « J » dans l\'air.', fingers: [0, 0, 0, 0, 0], motion: true, move: { kind: 'path', path: 'j' }, ignoreShape: true },
  { id: 'k', label: 'K', hint: 'Index et majeur tendus, autres doigts repliés.', fingers: [0.1, 1, 1, 0, 0] },
  { id: 'l', label: 'L', hint: 'Index et pouce tendus à angle droit, autres doigts repliés.', fingers: [0.9, 1, 0, 0, 0] },
  { id: 'm', label: 'M', hint: "Main à plat, à l'horizontale, doigts tendus et serrés, pouce replié.", fingers: [0.1, 1, 1, 1, 1], orientation: 'side' },
  { id: 'n', label: 'N', hint: "Index et majeur tendus et serrés, à l'horizontale, autres doigts repliés.", fingers: [0.1, 1, 1, 0, 0], spread: 'tight', orientation: 'side' },
  { id: 'p', label: 'P', hint: 'Suis la flèche de la photo : la main à plat pivote vers le bas.', fingers: [0, 0, 0, 0, 0], motion: true, move: { kind: 'pivot-down' }, ignoreShape: true },
  { id: 'q', label: 'Q', hint: 'Index pointé vers le bas, autres doigts repliés.', fingers: [0.1, 1, 0, 0, 0], orientation: 'down' },
  { id: 'r', label: 'R', hint: 'Index et majeur croisés, autres doigts repliés.', fingers: [0.1, 1, 1, 0, 0], spread: 'tight', orientation: 'up' },
  { id: 's', label: 'S', hint: 'Poing fermé, pouce replié devant les doigts.', fingers: [0.2, 0, 0, 0, 0] },
  { id: 't', label: 'T', hint: 'Voir la photo : pouce plié contre l\'index, les trois autres doigts tendus et écartés.', fingers: [0.4, 0.6, 1, 1, 1], pinch: false },
  { id: 'v', label: 'V', hint: 'Index et majeur tendus et écartés en « V », autres doigts repliés.', fingers: [0.1, 1, 1, 0, 0], spread: 'wide' },
  { id: 'w', label: 'W', hint: 'Index, majeur et annulaire tendus et écartés, pouce et auriculaire repliés.', fingers: [0.1, 1, 1, 1, 0] },
  { id: 'x', label: 'X', hint: 'Index et majeur recourbés en crochet, autres doigts repliés.', fingers: [0.1, 0.5, 0.5, 0, 0] },
  { id: 'z', label: 'Z', hint: 'Poing, pouce levé : la main trace un « Z » dans l\'air.', fingers: [0.8, 0, 0, 0, 0], motion: true, move: { kind: 'path', path: 'z' } },
]

const ONE: FingerValues = [0.8, 0, 0, 0, 0]
const TWO: FingerValues = [0.8, 1, 0, 0, 0]
const THREE: FingerValues = [0.8, 1, 1, 0, 0]
const FOUR: FingerValues = [0.1, 1, 1, 1, 1]
const FIVE: FingerValues = [0.8, 1, 1, 1, 1]
const ZERO: FingerValues = [0.5, 0.5, 0.5, 0.5, 0.5]
const NO_FINGERS: FingerValues = [0, 0, 0, 0, 0]

const hand = (fingers: FingerValues, pinch?: boolean): HandDrawing => ({ fingers, pinch })

/** Chiffres : de 0 à 5 avec une main, de 6 à 9 une main fait 5 et l'autre fait 1, 2, 3 ou 4. */
export const DIGITS: Sign[] = [
  { id: '0', label: '0', hint: "Le pouce et l'index se touchent en cercle, les autres doigts sont arrondis.", fingers: ZERO, pinch: true, hands: [hand(ZERO, true)] },
  { id: '1', label: '1', hint: 'Poing fermé, pouce levé.', fingers: ONE, hands: [hand(ONE)] },
  { id: '2', label: '2', hint: 'Pouce et index tendus, les autres doigts repliés.', fingers: TWO, hands: [hand(TWO)] },
  { id: '3', label: '3', hint: 'Pouce, index et majeur tendus, annulaire et auriculaire repliés.', fingers: THREE, hands: [hand(THREE)] },
  { id: '4', label: '4', hint: 'Quatre doigts tendus, pouce replié sur la paume.', fingers: FOUR, hands: [hand(FOUR)] },
  { id: '5', label: '5', hint: 'Main ouverte, les cinq doigts tendus et écartés.', fingers: FIVE, hands: [hand(FIVE)] },
  { id: '6', label: '6', hint: 'Deux mains : une main fait 5, l\'autre fait 1 (poing, pouce levé).', fingers: FIVE, second: { fingers: ONE }, hands: [hand(ONE), hand(FIVE)] },
  { id: '7', label: '7', hint: 'Deux mains : une main fait 5, l\'autre fait 2 (pouce et index).', fingers: FIVE, second: { fingers: TWO }, hands: [hand(TWO), hand(FIVE)] },
  { id: '8', label: '8', hint: 'Deux mains : une main fait 5, l\'autre fait 3 (pouce, index et majeur).', fingers: FIVE, second: { fingers: THREE }, hands: [hand(THREE), hand(FIVE)] },
  { id: '9', label: '9', hint: 'Deux mains : une main fait 5, l\'autre fait 4 (quatre doigts tendus).', fingers: FIVE, second: { fingers: FOUR }, hands: [hand(FOUR), hand(FIVE)] },
]

/** Nombres de 10 à 19 : tous comportent un mouvement, l'élève les valide lui-même. */
const UP: [string, FingerValues, string][] = [
  ['11', ONE, '1'],
  ['12', TWO, '2'],
  ['13', THREE, '3'],
  ['14', FOUR, '4'],
  ['15', FIVE, '5'],
]
const DOWN: [string, FingerValues, string][] = [
  ['16', ONE, '1'],
  ['17', TWO, '2'],
  ['18', THREE, '3'],
  ['19', FOUR, '4'],
]

export const NUMBERS: Sign[] = [
  {
    id: '10',
    label: '10',
    hint: "Les deux mains forment un cercle (pouce et index qui se touchent, autres doigts dépliés) et se rapprochent l'une de l'autre.",
    fingers: NO_FINGERS,
    motion: true,
    move: { kind: 'together' },
    ignoreShape: true,
    hands: [hand([0.5, 0.5, 1, 1, 1], true), hand([0.5, 0.5, 1, 1, 1], true)],
    arrow: 'together',
  },
  ...UP.map(([id, fingers, digit]): Sign => ({
    id,
    label: id,
    hint: `Comme le ${digit}, mais la main monte d'un petit coup vers le haut.`,
    fingers,
    motion: true,
    move: { kind: 'up' },
    hands: [hand(fingers)],
    arrow: 'up',
  })),
  ...DOWN.map(([id, fingers, digit]): Sign => ({
    id,
    label: id,
    hint: `Comme le ${Number(digit) + 5} avec les deux mains, mais elles descendent d'un petit coup.`,
    fingers: FIVE,
    second: { fingers },
    motion: true,
    move: { kind: 'down' },
    hands: [hand(fingers), hand(FIVE)],
    arrow: 'down',
  })),
]

/** Toutes les lettres, dans l'ordre alphabétique. */
export const ALPHABET: Sign[] = [...VOWELS, ...CONSONANTS].sort((a, b) => a.id.localeCompare(b.id))

/** Passages demandés pour chaque signe pendant l'apprentissage. */
export const REPETITIONS = 3
