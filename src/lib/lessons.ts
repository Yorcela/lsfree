import { ALPHABET, BIG_NUMBERS, CONSONANTS, DIGITS, NUMBERS, TENS, TWENTY, VOWELS, type Sign } from './signs'
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
  /** Pour un quiz : nombre de questions tirées au hasard parmi les signes (tous si absent). */
  quizSize?: number
  /** Signes tirés d'une seule source, qui varient selon les régions : à confirmer. */
  unverified?: boolean
}

function pick(ids: string): Sign[] {
  return ids.split(' ').map((id) => CONSONANTS.find((s) => s.id === id)!)
}

function lesson(id: string, title: string, signs: Sign[], extra: Partial<Lesson> = {}): Lesson {
  return { id, title, subtitle: signs.map((s) => s.label).join(' '), signs, ...extra }
}

const slice = (signs: Sign[], from: number, to: number) => signs.slice(from, to)

/** Leçons des chiffres et des nombres, dans l'ordre conseillé. */
export const NUMBER_LESSONS: Lesson[] = [
  lesson('nombres-0-10', 'Nombres de 0 à 10', [...DIGITS, ...slice(NUMBERS, 0, 1)]),
  lesson('nombres-11-20', 'Nombres de 11 à 20', [...slice(NUMBERS, 1, 10), TWENTY]),
  lesson('dizaines', 'Les dizaines, de 30 à 100', TENS, { unverified: true }),
  lesson('grands-nombres', 'Mille, million…', BIG_NUMBERS, { unverified: true }),
]

/** Le quiz des nombres : 10 nombres tirés au hasard parmi tous ceux qui ont été vus, débloqué quand chaque séance a une étoile. */
export const NUMBER_QUIZ: Lesson = {
  id: 'nombres-quiz',
  title: 'Quiz des nombres',
  subtitle: '10 au hasard',
  signs: NUMBER_LESSONS.flatMap((l) => l.signs),
  quizOnly: true,
  quizSize: 10,
  requires: NUMBER_LESSONS.map((l) => l.id),
  unverified: true,
}

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
