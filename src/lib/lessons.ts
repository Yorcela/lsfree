import { CONSONANTS, DIGITS, NUMBERS, VOWELS, type Sign } from './signs'

export interface Lesson {
  id: string
  title: string
  subtitle: string
  signs: Sign[]
}

function pick(ids: string): Sign[] {
  return ids.split(' ').map((id) => CONSONANTS.find((s) => s.id === id)!)
}

function lesson(id: string, title: string, signs: Sign[]): Lesson {
  return { id, title, subtitle: signs.map((s) => s.label).join(' '), signs }
}

const slice = (signs: Sign[], from: number, to: number) => signs.slice(from, to)

/** Leçons des chiffres et des nombres, dans l'ordre conseillé. */
export const NUMBER_LESSONS: Lesson[] = [
  lesson('chiffres-0-5', 'Chiffres de 0 à 5', slice(DIGITS, 0, 6)),
  lesson('chiffres-6-9', 'Chiffres de 6 à 9', slice(DIGITS, 6, 10)),
  lesson('nombres-10-15', 'Nombres de 10 à 15', slice(NUMBERS, 0, 6)),
  lesson('nombres-16-19', 'Nombres de 16 à 19', slice(NUMBERS, 6, 10)),
]

/** Leçons de l'alphabet, dans l'ordre conseillé. */
export const ALPHABET_LESSONS: Lesson[] = [
  lesson('voyelles', 'Les voyelles', VOWELS),
  lesson('consonnes-1', 'Consonnes 1', pick('b c d f g')),
  lesson('consonnes-2', 'Consonnes 2', pick('h j k l m')),
  lesson('consonnes-3', 'Consonnes 3', pick('n p q r s')),
  lesson('consonnes-4', 'Consonnes 4', pick('t v w x z')),
]
