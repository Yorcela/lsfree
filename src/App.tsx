import { useCallback, useMemo, useState } from 'react'
import { LessonRunner } from './components/LessonRunner'
import { Mascot } from './components/Mascot'
import { ProgressBar } from './components/ProgressBar'
import { Stars } from './components/Stars'
import { ALPHABET_LESSONS, NUMBER_LESSONS, WORD_LESSONS, nameLetters, presentationLesson, type Lesson } from './lib/lessons'
import { loadName, loadStars, saveName, saveStars, type StarsMap } from './lib/progress'
import { ALPHABET } from './lib/signs'

type Tab = 'alphabet' | 'chiffres' | 'mots'

const TABS: { id: Tab; label: string }[] = [
  { id: 'alphabet', label: 'Alphabet' },
  { id: 'chiffres', label: 'Chiffres' },
  { id: 'mots', label: 'Mots' },
]

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
  const [name, setName] = useState(loadName)

  const presentation = useMemo(() => presentationLesson(name), [name])
  const wordLessons = useMemo(() => [...WORD_LESSONS, presentation], [presentation])
  const allLessons = useMemo(
    () => [...ALPHABET_LESSONS, ...NUMBER_LESSONS, ...wordLessons],
    [wordLessons],
  )

  const changeName = (value: string) => {
    const clean = value.replace(/[^\p{L} '-]/gu, '').slice(0, 20)
    setName(clean)
    saveName(clean)
  }

  const onFinished = useCallback((id: string, earned: number) => setStars(saveStars(id, earned)), [])

  const goTo = (next: Tab) => {
    setTab(next)
    setLesson(null)
  }

  const finishedLessons = allLessons.filter((l) => (stars[l.id] ?? 0) > 0).length

  return (
    <main className={lesson ? 'app wide' : 'app'}>
      <h1>LSF Free</h1>
      <p className="subtitle">Apprends la langue des signes française avec ta webcam.</p>

      {!lesson && (
        <p className="privacy">
          <strong>Ta vie privée :</strong> la caméra sert uniquement à repérer ta main. Ton visage et ton
          arrière-plan ne sont jamais affichés, et aucune image n'est enregistrée ni envoyée : tout se passe dans
          ton navigateur. Seul le tracé de ta main apparaît à l'écran.
        </p>
      )}

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
            Leçons terminées : {finishedLessons} sur {allLessons.length}
          </p>
          <ProgressBar value={finishedLessons / allLessons.length} label="Progression globale" />
          <Mascot mood={finishedLessons === allLessons.length ? 'amoureux' : finishedLessons > 0 ? 'fier' : 'heureux'}>
            {finishedLessons === 0
              ? 'Salut ! Choisis une leçon pour commencer : je te dirai quels signes faire.'
              : finishedLessons === allLessons.length
                ? 'Bravo, tu as tout terminé ! Tu peux refaire les interros pour gagner toutes les étoiles.'
                : `Content de te revoir ! Tu as terminé ${finishedLessons} leçon${finishedLessons > 1 ? 's' : ''}. On continue ?`}
          </Mascot>
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

      {!lesson && tab === 'mots' && (
        <>
          <LessonGrid lessons={WORD_LESSONS} stars={stars} onOpen={setLesson} />

          <section className="card name-card">
            <h2>Je m'appelle…</h2>
            <label className="name-field">
              <span>Ton prénom, que tu épelleras avec l'alphabet</span>
              <input
                type="text"
                value={name}
                maxLength={20}
                placeholder="Alec"
                autoComplete="off"
                onChange={(e) => changeName(e.target.value)}
              />
            </label>
            <LessonGrid
              lessons={[presentation]}
              stars={stars}
              onOpen={nameLetters(name).length > 0 ? setLesson : () => {}}
            />
          </section>

          <p className="note">
            Les signes de la vie quotidienne varient selon les régions et les personnes, et ils s'accompagnent
            d'une expression du visage. La caméra ne voit que ta main (jamais ton visage) : elle vérifie la forme
            de la main et le mouvement, pas l'endroit où tu la poses. Pour être sûr du signe, regarde-le avec une
            personne sourde ou dans un dictionnaire de LSF.
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
