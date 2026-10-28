import { useEffect, useRef, useState } from 'react'
import { SUCCESS_SCORE, useHandTracking, type Live } from './hooks/useHandTracking'
import { PARTS } from './lib/landmarks'
import { REPETITIONS, VOWELS, type Sign } from './lib/signs'

type Phase = 'intro' | 'learn' | 'quizIntro' | 'quiz' | 'result'
type Outcome = 'ok' | 'hint' | 'skipped'
interface Answer {
  sign: Sign
  outcome: Outcome
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  ok: 'Réussi seul',
  hint: 'Réussi avec indice',
  skipped: 'Passé',
}

/** Apprentissage : les voyelles dans l'ordre, tour après tour, sans jamais répéter la même lettre d'affilée. */
const LEARN_SEQUENCE = Array.from({ length: REPETITIONS }, () => VOWELS).flat()

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function Photo({ sign }: { sign: Sign }) {
  return (
    <img
      className="sign-image"
      src={`./signs/${sign.id}.jpg`}
      alt={`Signe de la lettre ${sign.label}`}
      onError={(e) => (e.currentTarget.style.display = 'none')}
    />
  )
}

function feedbackFor(live: Live, flash: boolean, detailed: boolean): string {
  if (flash) return 'Bravo !'
  if (!live.hand) return 'Montre ta main devant la caméra.'
  const m = live.match
  if (!m) return ''
  if (m.score >= SUCCESS_SCORE) return 'Parfait, garde la position !'
  if (!detailed) return m.score >= 0.5 ? 'Presque !' : "Ce n'est pas encore ça."
  if (m.direction === 'touch') return "Rapproche le pouce et l'index pour qu'ils se touchent."
  return `${m.direction === 'unfold' ? 'Déplie' : 'Replie'} ${PARTS[m.worst]}.`
}

function App() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [pos, setPos] = useState(0)
  const [order, setOrder] = useState<Sign[]>([])
  const [question, setQuestion] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<number | undefined>(undefined)

  const target = phase === 'learn' ? LEARN_SEQUENCE[pos] : phase === 'quiz' ? order[question] : null
  const cameraOn = phase === 'learn' || phase === 'quizIntro' || phase === 'quiz'

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const showFlash = () => {
    setFlash(true)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(false), 1200)
  }

  const finishQuestion = (outcome: Outcome) => {
    const next = [...answers, { sign: order[question], outcome }]
    setAnswers(next)
    setHintLevel(0)
    if (question + 1 >= order.length) setPhase('result')
    else setQuestion(question + 1)
  }

  const nextLearn = () => {
    if (pos + 1 < LEARN_SEQUENCE.length) setPos(pos + 1)
    else setPhase('quizIntro')
  }

  const onSuccess = () => {
    showFlash()
    if (phase === 'learn') {
      nextLearn()
    } else if (phase === 'quiz') {
      finishQuestion(hintLevel > 0 ? 'hint' : 'ok')
    }
  }

  const { videoRef, canvasRef, status, error, live } = useHandTracking(cameraOn, target, onSuccess)

  const startLearning = () => {
    setPos(0)
    setPhase('learn')
  }

  const startQuiz = () => {
    setOrder(shuffle(VOWELS))
    setQuestion(0)
    setHintLevel(0)
    setAnswers([])
    setPhase('quiz')
  }

  const inQuiz = phase === 'quiz'
  const detailed = !inQuiz || hintLevel > 0
  const score = live.match?.score ?? 0

  return (
    <main className="app">
      <h1>LSF Free</h1>
      <p className="subtitle">Apprends la langue des signes française avec ta webcam.</p>

      {phase === 'intro' && (
        <section className="card intro">
          <h2>Leçon 1 : les voyelles</h2>
          <ol>
            <li>
              Tu fais les voyelles A, E, I, O, U, Y les unes après les autres, en regardant la photo, et tu
              recommences {REPETITIONS} fois la série. Tu peux passer à la lettre suivante quand tu veux.
            </li>
            <li>Ensuite, une petite interro : on te donne une lettre, à toi de retrouver le signe.</li>
            <li>Si tu bloques, tu peux demander un indice.</li>
          </ol>
          <p className="privacy">
            <strong>Ta vie privée :</strong> la caméra sert uniquement à repérer ta main. Ton visage et ton
            arrière-plan ne sont jamais affichés, et aucune image n'est enregistrée ni envoyée : tout se passe
            dans ton navigateur. Seul le tracé de ta main apparaît à l'écran.
          </p>
          <button type="button" className="primary" onClick={startLearning}>
            Commencer
          </button>
        </section>
      )}

      {phase === 'result' && (
        <section className="card result">
          <h2>Résultat de l'interro</h2>
          <p className="big-score">
            {answers.filter((a) => a.outcome === 'ok').length} / {answers.length} sans aide
          </p>
          <ul className="answers">
            {answers.map((a) => (
              <li key={a.sign.id} className={a.outcome}>
                <span className="answer-letter">{a.sign.label}</span> {OUTCOME_LABEL[a.outcome]}
              </li>
            ))}
          </ul>
          <div className="actions center">
            <button type="button" className="primary" onClick={startQuiz}>
              Refaire l'interro
            </button>
            <button type="button" onClick={startLearning}>
              Revoir le cours
            </button>
          </div>
        </section>
      )}

      <div className="stage" hidden={!cameraOn}>
        <section className="card reference">
          {phase === 'learn' && (
            <>
              <h2>
                Tour {Math.floor(pos / VOWELS.length) + 1} sur {REPETITIONS}
              </h2>
              <div className="chips" aria-label="Lettres de ce tour">
                {VOWELS.map((v, i) => {
                  const inRound = pos % VOWELS.length
                  return (
                    <span key={v.id} className={i < inRound ? 'chip done' : i === inRound ? 'chip current' : 'chip'}>
                      {v.label}
                    </span>
                  )
                })}
              </div>
              <div className="sign-label">{LEARN_SEQUENCE[pos].label}</div>
              <Photo sign={LEARN_SEQUENCE[pos]} />
              <p>{LEARN_SEQUENCE[pos].hint}</p>
              <div className="actions center">
                <button type="button" onClick={nextLearn}>
                  Lettre suivante
                </button>
              </div>
            </>
          )}

          {phase === 'quizIntro' && (
            <>
              <h2>Bravo, cours terminé !</h2>
              <p>Place à l'interro : {VOWELS.length} lettres dans le désordre. Les photos sont cachées, mais tu peux demander un indice.</p>
              <button type="button" className="primary" onClick={startQuiz}>
                Démarrer l'interro
              </button>
            </>
          )}

          {inQuiz && order[question] && (
            <>
              <h2>
                Question {question + 1} sur {order.length}
              </h2>
              <p>Fais le signe de la lettre</p>
              <div className="sign-label">{order[question].label}</div>
              {hintLevel >= 1 && <p className="hint">Indice : {order[question].hint}</p>}
              {hintLevel >= 2 && <Photo sign={order[question]} />}
              <div className="actions center">
                {hintLevel < 2 && (
                  <button type="button" onClick={() => setHintLevel(hintLevel + 1)}>
                    {hintLevel === 0 ? 'Un indice ?' : 'Encore un indice'}
                  </button>
                )}
                <button type="button" onClick={() => finishQuestion('skipped')}>
                  Passer
                </button>
              </div>
            </>
          )}
        </section>

        <section className="card camera">
          <div className="hand-wrap">
            <video ref={videoRef} className="hidden-video" playsInline muted />
            <canvas ref={canvasRef} />
            {status === 'loading' && <div className="overlay">Chargement du suivi de la main…</div>}
            {status === 'error' && <div className="overlay error">Caméra indisponible : {error}</div>}
          </div>
          {(!inQuiz || hintLevel > 0) && target && (
            <div className="meter" aria-label="Précision du signe">
              <div
                className={`meter-bar ${score >= SUCCESS_SCORE ? 'good' : ''}`}
                style={{ width: `${Math.round(score * 100)}%` }}
              />
            </div>
          )}
          <p className="feedback" role="status">
            {target ? feedbackFor(live, flash, detailed) : ''}
          </p>
          <p className="privacy small">
            Seule ta main est suivie : ni ton visage ni ton arrière-plan ne sont affichés, rien n'est enregistré.
          </p>
          {live.match && (
            <details className="debug">
              <summary>Ce que la caméra voit</summary>
              {['pouce', 'index', 'majeur', 'annulaire', 'auriculaire'].map((name, i) => (
                <div key={name} className="debug-row">
                  <span>
                    {name} {Math.round(live.match!.values[i] * 100)} %
                  </span>
                  <div className="meter">
                    <div className="meter-bar" style={{ width: `${Math.round(live.match!.values[i] * 100)}%` }} />
                  </div>
                </div>
              ))}
            </details>
          )}
        </section>
      </div>

      <footer className="credits">
        Photos des lettres : Wikimedia Commons (« LSF Lettre A » à « LSF Lettre Z »), sous licence{' '}
        <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr" target="_blank" rel="noreferrer">
          CC BY-SA 3.0
        </a>
        .
      </footer>
    </main>
  )
}

export default App
