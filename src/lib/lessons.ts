import { ALPHABET, CONSONANTS, DIGITS, NUMBERS, VOWELS, type Sign } from './signs'
import { GREETINGS, ME } from './words'

export interface Lesson {
  id: string
  title: string
  subtitle: string
  signs: Sign[]
  /** Pas d'apprentissage : on passe directement à l'interro (décompte puis questions). */
  quizOnly?: boolean
  /** Leçons à terminer (au moins une étoile chacune) avant de pouvoir commencer celle-ci. */
  requires?: string[]
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

/** Lettres du prénom, sans accents ni doublons : chaque lettre n'est épelée qu'une fois dans la leçon. */
export function nameLetters(name: string): Sign[] {
  const letters = name
    .normalize('NFD')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase()
    .split('')
  return [...new Set(letters)].map((id) => ALPHABET.find((s) => s.id === id)!)
}

/** « Je m'appelle … » : on pointe vers soi, puis on épelle son prénom avec l'alphabet manuel. */
export function presentationLesson(name: string): Lesson {
  const letters = nameLetters(name)
  return {
    id: 'presentation',
    title: 'Me présenter',
    subtitle: `Je + ${letters.map((s) => s.label).join(' ')}`,
    signs: [ME, ...letters],
  }
}

/** Leçons des mots de la vie de tous les jours. */
export const WORD_LESSONS: Lesson[] = [lesson('politesse', 'Politesse', GREETINGS)]

/** Leçons de l'alphabet, dans l'ordre conseillé. */
export const ALPHABET_LESSONS: Lesson[] = [
  lesson('voyelles', 'Les voyelles', VOWELS),
  lesson('consonnes-1', 'Consonnes 1', pick('b c d f g')),
  lesson('consonnes-2', 'Consonnes 2', pick('h j k l m')),
  lesson('consonnes-3', 'Consonnes 3', pick('n p q r s')),
  lesson('consonnes-4', 'Consonnes 4', pick('t v w x z')),
]

/** Le grand quiz : les 26 lettres dans le désordre, débloqué quand chaque leçon de l'alphabet a au moins une étoile. */
export const ALPHABET_QUIZ: Lesson = {
  id: 'alphabet-quiz',
  title: "Quiz de l'alphabet",
  subtitle: 'A à Z',
  signs: ALPHABET,
  quizOnly: true,
  requires: ALPHABET_LESSONS.map((l) => l.id),
}

/** Leçons exigées par `lesson` qui n'ont pas encore au moins une étoile. */
export function missingRequirements(lesson: Lesson, stars: Record<string, number>): Lesson[] {
  const all = [...ALPHABET_LESSONS, ...NUMBER_LESSONS, ...WORD_LESSONS]
  return (lesson.requires ?? [])
    .filter((id) => (stars[id] ?? 0) < 1)
    .map((id) => all.find((l) => l.id === id)!)
}
