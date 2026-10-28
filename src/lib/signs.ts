import type { FingerValues, SignSpec } from './landmarks'
import type { MotionSpec } from './motion'

/** Une main dessinée dans une illustration. */
export interface HandDrawing {
  fingers: FingerValues
  pinch?: boolean
}

/** Endroits du corps, sur le schéma animé d'un signe. */
export type Spot = 'forehead' | 'mouth' | 'chin' | 'cheek' | 'chest' | 'front'

/** Schéma animé d'un signe : où est la main au départ, où elle va, et si elle s'approche ou se balance. */
export interface DiagramSpec {
  hand: FingerValues
  from: Spot
  to?: Spot
  /** La main s'avance vers le spectateur (elle grossit). */
  grow?: boolean
  /** La main se balance de gauche à droite. */
  wave?: boolean
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
  /** Schéma animé du corps et de la main : pour les mots, dont la place sur le visage compte. */
  diagram?: DiagramSpec
  /** Nom de la main robot à montrer (public/hands/<nom>.png) quand l'identifiant du signe n'est pas une lettre. */
  sprite?: string
}

export const VOWELS: Sign[] = [
  { id: 'a', label: 'A', hint: 'Poing fermé, pouce tendu sur le côté.', fingers: [0.8, 0, 0, 0, 0] },
  { id: 'e', label: 'E', hint: 'Doigts repliés en griffe, pouce plié sous les doigts.', fingers: [0.1, 0.35, 0.35, 0.35, 0.35] },
  { id: 'i', label: 'I', hint: 'Poing fermé, auriculaire tendu.', fingers: [0, 0, 0, 0, 1] },
  { id: 'o', label: 'O', hint: 'Doigts arrondis, le pouce touche le bout des doigts pour former un « O ».', fingers: [0.5, 0.5, 0.5, 0.5, 0.5], pinch: true, ignore: [0, 1] },
  { id: 'u', label: 'U', hint: 'Index et majeur tendus et collés, autres doigts repliés.', fingers: [0, 1, 1, 0, 0], spread: 'tight' },
  { id: 'y', label: 'Y', hint: 'Pouce et auriculaire tendus, les trois autres doigts repliés.', fingers: [0.8, 0, 0, 0, 1] },
]

export const CONSONANTS: Sign[] = [
  { id: 'b', label: 'B', hint: 'Main ouverte et droite, doigts serrés et tendus vers le haut, pouce replié sur la paume.', fingers: [0.1, 1, 1, 1, 1], orientation: 'up' },
  { id: 'c', label: 'C', hint: 'Main en forme de « C » : doigts arrondis, pouce opposé aux doigts.', fingers: [0.6, 0.5, 0.5, 0.5, 0.5], pinch: false },
  { id: 'd', label: 'D', hint: 'Index tendu vers le haut, les autres doigts arrondis, le pouce touche le majeur.', fingers: [0.3, 1, 0.15, 0.15, 0.15], ignore: [0] },
  { id: 'f', label: 'F', hint: "Le pouce et l'index se touchent en cercle, les trois autres doigts sont tendus et écartés.", fingers: [0.1, 0.1, 1, 1, 1], pinch: true, ignore: [0, 1] },
  { id: 'g', label: 'G', hint: 'Index tendu vers le haut, les autres doigts et le pouce repliés.', fingers: [0.1, 1, 0, 0, 0] },
  { id: 'h', label: 'H', hint: 'Index et auriculaire tendus, majeur et annulaire repliés.', fingers: [0.1, 1, 0, 0, 1] },
  { id: 'j', label: 'J', hint: 'Pouce et auriculaire tendus : la main pivote et trace un « J » dans l\'air, comme la flèche.', fingers: [0, 0, 0, 0, 0], motion: true, move: { kind: 'path', path: 'j' }, ignoreShape: true },
  { id: 'k', label: 'K', hint: 'Index et majeur tendus, autres doigts repliés.', fingers: [0.1, 1, 1, 0, 0] },
  { id: 'l', label: 'L', hint: 'Index et pouce tendus à angle droit, autres doigts repliés.', fingers: [0.9, 1, 0, 0, 0] },
  { id: 'm', label: 'M', hint: "Main à plat, à l'horizontale, doigts tendus et serrés, pouce replié.", fingers: [0.1, 1, 1, 1, 1], ignore: [0], orientation: 'side' },
  { id: 'n', label: 'N', hint: "Index et majeur tendus et serrés, à l'horizontale, autres doigts repliés.", fingers: [0.1, 1, 1, 0, 0], ignore: [0], spread: 'tight', orientation: 'side' },
  { id: 'p', label: 'P', hint: 'La main pointée vers le bas hoche vers le bas, comme la flèche.', fingers: [0, 0, 0, 0, 0], motion: true, move: { kind: 'pivot-down' }, ignoreShape: true },
  { id: 'q', label: 'Q', hint: 'Index pointé vers le bas, autres doigts repliés.', fingers: [0.1, 1, 0, 0, 0], orientation: 'down' },
  { id: 'r', label: 'R', hint: 'Index et majeur croisés, autres doigts repliés.', fingers: [0.1, 1, 1, 0, 0], spread: 'tight', orientation: 'up' },
  { id: 's', label: 'S', hint: 'Poing fermé, pouce replié devant les doigts.', fingers: [0.2, 0, 0, 0, 0] },
  { id: 't', label: 'T', hint: 'Voir la photo : index et pouce couchés l\'un vers l\'autre, majeur, annulaire et auriculaire tendus et écartés.', fingers: [0.5, 0.5, 1, 1, 1], ignore: [0, 1] },
  { id: 'v', label: 'V', hint: 'Index et majeur tendus et écartés en « V », autres doigts repliés.', fingers: [0.1, 1, 1, 0, 0], spread: 'wide' },
  { id: 'w', label: 'W', hint: 'Index, majeur et annulaire tendus et écartés, pouce et auriculaire repliés.', fingers: [0.1, 1, 1, 1, 0] },
  { id: 'x', label: 'X', hint: 'Index et majeur recourbés en crochet, autres doigts repliés.', fingers: [0.1, 0.5, 0.5, 0, 0] },
  { id: 'z', label: 'Z', hint: 'Poing fermé, index pointé : la main trace un « Z » dans l\'air, comme la flèche.', fingers: [0.5, 0.5, 0, 0, 0], ignore: [0, 1], motion: true, move: { kind: 'path', path: 'z' } },
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
  { id: '0', label: '0', hint: "Le pouce et l'index se touchent en cercle, les autres doigts sont arrondis.", fingers: ZERO, pinch: true, ignore: [0, 1], hands: [hand(ZERO, true)] },
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

/** 20 : pouce et index en pince fermée, avec un petit mouvement du poignet. */
export const TWENTY: Sign = {
  id: '20',
  label: '20',
  hint: 'Pouce et index en pince fermée, les autres doigts repliés, avec un petit mouvement du poignet.',
  fingers: [0.1, 0.1, 0, 0, 0],
  pinch: true,
  ignore: [0, 1],
  motion: true,
  move: { kind: 'any' },
  hands: [hand([0.3, 0.2, 0, 0, 0], true)],
}

/** Un signe de dizaine : le signe du chiffre correspondant, avec un mouvement de fermeture et d'ouverture. */
const tens = (digit: Sign, label: string): Sign => ({
  ...digit,
  id: label,
  label,
  hint: `Le signe du ${digit.label}, avec un mouvement de fermeture et d'ouverture de la main.`,
  motion: true,
  move: { kind: 'any' },
})

/**
 * Dizaines de 30 à 100. Les signes varient selon les régions : à confirmer avec une personne sourde. On ne retient
 * ici que la règle « signe du chiffre + mouvement de pince » ; la caméra vérifie la forme et un mouvement.
 */
export const TENS: Sign[] = [
  tens(DIGITS[3], '30'),
  tens(DIGITS[4], '40'),
  tens(DIGITS[5], '50'),
  tens(DIGITS[6], '60'),
  tens(DIGITS[7], '70'),
  tens(DIGITS[8], '80'),
  tens(DIGITS[9], '90'),
  {
    id: '100',
    label: '100',
    hint: 'Le chiffre 1, puis la lettre C : la main en forme de « C ».',
    fingers: CONSONANTS.find((s) => s.id === 'c')!.fingers,
    pinch: false,
    sprite: 'c',
  },
]

const FLAT_HAND: FingerValues = [0.5, 1, 1, 1, 1]

/** Mille et au-delà : la main dominante vient taper dans la paume de l'autre main. */
const tap = (id: string, label: string, hint: string, kind: 'together' | 'tap-twice'): Sign => ({
  id,
  label,
  hint,
  fingers: FLAT_HAND,
  ignore: [0],
  second: { fingers: FLAT_HAND, ignore: [0] },
  motion: true,
  // Pendant le choc, une main cache l'autre : seul le rapprochement des deux mains est jugé.
  move: { kind },
  ignoreShape: true,
  hands: [hand(FLAT_HAND), hand(FLAT_HAND)],
  arrow: 'together',
})

/** Grands nombres. Les signes varient selon les régions : à confirmer avec une personne sourde. */
export const BIG_NUMBERS: Sign[] = [
  tap('1000', '1000', "Mille : la main dominante vient taper dans la paume de l'autre main.", 'together'),
  tap('10000', '10 000', 'Le chiffre 10, puis « mille » : la main vient taper dans la paume de l\'autre main.', 'together'),
  tap('100000', '100 000', 'Le chiffre 100 (1 puis C), puis « mille » : la main vient taper dans la paume de l\'autre main.', 'together'),
  tap('1000000', '1 million', 'Million : la main vient taper deux fois dans la paume de l\'autre main, en avançant légèrement.', 'tap-twice'),
]

/** Mains robot qui n'ont pas de lettre : on les réutilise pour les chiffres et les mots. */
export const EXTRA_SPRITES = ['five']

/**
 * La main robot qui correspond à une forme de doigts, quand on en a une : le pouce levé (1) est la main du A, le 2 est
 * celle du L, le 4 celle du B, la main ouverte (5) a son fichier, et l'index levé est celui du D.
 */
export function spriteForFingers(fingers: FingerValues): string | undefined {
  const known: [FingerValues, string][] = [
    [[0.8, 0, 0, 0, 0], 'a'],
    [[0.8, 1, 0, 0, 0], 'l'],
    [[0.1, 1, 1, 1, 1], 'b'],
    [[0.5, 1, 1, 1, 1], 'b'],
    [[0.8, 1, 1, 1, 1], 'five'],
    [[0.1, 1, 0, 0, 0], 'd'],
  ]
  return known.find(([f]) => f.every((v, i) => v === fingers[i]))?.[1]
}

/** Toutes les lettres, dans l'ordre alphabétique. */
export const ALPHABET: Sign[] = [...VOWELS, ...CONSONANTS].sort((a, b) => a.id.localeCompare(b.id))

/**
 * Lettres dont la main robot (public/hands/<lettre>.png) a été vérifiée. Les autres gardent la photo.
 * À compléter quand les mains de G, O, T et W seront corrigées.
 */
export const HAND_SPRITES = new Set('abcdefhijklmnpqrsuvxyz'.split(''))

/** Passages demandés pour chaque signe pendant l'apprentissage. */
export const REPETITIONS = 3
