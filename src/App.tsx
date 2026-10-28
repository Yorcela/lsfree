import { useCallback, useState } from 'react'
import { LessonRunner } from './components/LessonRunner'
import { ProgressBar } from './components/ProgressBar'
import { Stars } from './components/Stars'
import { ALPHABET_LESSONS, NUMBER_LESSONS, type Lesson } from './lib/lessons'
import { loadStars, saveStars, type StarsMap } from './lib/progress'
import { ALPHABET } from './lib/signs'

type Tab = 'alphabet' | 'chiffres'

const TABS: { id: Tab; label: string }[] = [
  { id: 'alphabet', label: 'Alphabet' },
  { id: 'chiffres', label: 'Chiffres' },
]

const ALL_LESSONS = [...ALPHABET_LESSONS, ...NUMBER_LESSONS]

function LessonGrid({ lessons, stars, onOpen }: { lessons: Lesson[]; stars: StarsMap; onOpen: (l: Lesson) => void }) {
  return (
    <div className="lesson-grid">
      {lessons.map((l) => (
        <button key={l.id} type="button" className="lesson-card" onClick={() => onOpen(l)}>
          <span className="lesson-title">{l.title}</span>
          <span className="lesson-letters">{l.subtitle}</span>
          <Stars count={stars[l.id] ?? 0} size={30} />
        </button>
      ))}
    </div>
  )
}

function App() {
  const [tab, setTab] = useState<Tab>('alphabet')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [stars, setStars] = useState(loadStars)

  const onFinished = useCallback((id: string, earned: number) => setStars(saveStars(id, earned)), [])

  const goTo = (next: Tab) => {
    setTab(next)
    setLesson(null)
  }

  const finishedLessons = ALL_LESSONS.filter((l) => (stars[l.id] ?? 0) > 0).length

  return (
    <main className="app">
      <h1>LSF Free</h1>
      <p className="subtitle">Apprends la langue des signes française avec ta webcam.</p>

      <nav className="nav" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? 'nav-item active' : 'nav-item'}
            aria-current={t.id === tab ? 'page' : undefined}
            onClick={() => goTo(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {lesson && <LessonRunner key={lesson.id} lesson={lesson} onExit={() => setLesson(null)} onFinished={onFinished} />}

      {!lesson && (
        <div className="global-progress">
          <p>
            Leçons terminées : {finishedLessons} sur {ALL_LESSONS.length}
          </p>
          <ProgressBar value={finishedLessons / ALL_LESSONS.length} label="Progression globale" />
        </div>
      )}

      {!lesson && tab === 'alphabet' && (
        <>
          <LessonGrid lessons={ALPHABET_LESSONS} stars={stars} onOpen={setLesson} />

          <details className="gallery">
            <summary>Aide-mémoire : tous les signes de l'alphabet</summary>
            <div className="gallery-grid">
              {ALPHABET.map((s) => (
                <figure key={s.id}>
                  <img src={`./signs/${s.id}.jpg`} alt={`Signe de la lettre ${s.label}`} loading="lazy" />
                  <figcaption>{s.label}</figcaption>
                </figure>
              ))}
            </div>
          </details>
        </>
      )}

      {!lesson && tab === 'chiffres' && (
        <>
          <LessonGrid lessons={NUMBER_LESSONS} stars={stars} onOpen={setLesson} />
          <p className="note">
            De 6 à 9, les signes se font avec les deux mains. Les nombres de 10 à 19 comportent un mouvement,
            que la caméra suit : suis le trait orange.
          </p>
        </>
      )}

      <footer className="credits">
        Photos des lettres : Wikimedia Commons (« LSF Lettre A » à « LSF Lettre Z »), sous licence{' '}
        <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr" target="_blank" rel="noreferrer">
          CC BY-SA 3.0
        </a>
        . Illustrations des chiffres dessinées pour LSF Free.
      </footer>
    </main>
  )
}

export default App
