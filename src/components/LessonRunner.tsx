import { useEffect, useMemo, useRef, useState } from 'react'
import { SUCCESS_SCORE, useHandTracking, type Live } from '../hooks/useHandTracking'
import type { Lesson } from '../lib/lessons'
import { HandIllustration } from './HandIllustration'
import { REPETITIONS, type Sign } from '../lib/signs'

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

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Photo pour les lettres, illustration dessinée pour les chiffres et les nombres. */
function Photo({ sign }: { sign: Sign }) {
  if (sign.hands) return <HandIllustration sign={sign} />
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
  return m.advice
}

interface Props {
  lesson: Lesson
  onExit: () => void
  onFinished: (lessonId: string) => void
}

export function LessonRunner({ lesson, onExit, onFinished }: Props) {
  const signs = lesson.signs
  // Apprentissage : les lettres dans l'ordre, tour après tour, sans jamais répéter la même d'affilée.
  const learnSequence = useMemo(() => Array.from({ length: REPETITIONS }, () => signs).flat(), [signs])

  const [phase, setPhase] = useState<Phase>('intro')
  const [pos, setPos] = useState(0)
  const [order, setOrder] = useState<Sign[]>([])
  const [question, setQuestion] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<number | undefined>(undefined)

  const current = phase === 'learn' ? learnSequence[pos] : phase === 'quiz' ? order[question] : undefined
  // Les signes avec mouvement ne sont pas détectés : l'élève valide lui-même.
  const target = current && !current.motion ? current : null
  const cameraOn = phase === 'learn' || phase === 'quizIntro' || phase === 'quiz'

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  useEffect(() => {
    if (phase === 'result') onFinished(lesson.id)
  }, [phase, lesson.id, onFinished])

  const showFlash = () => {
    setFlash(true)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(false), 1200)
  }

  const finishQuestion = (outcome: Outcome) => {
    setAnswers([...answers, { sign: order[question], outcome }])
    setHintLevel(0)
    if (question + 1 >= order.length) setPhase('result')
    else setQuestion(question + 1)
  }

  const nextLearn = () => {
    if (pos + 1 < learnSequence.length) setPos(pos + 1)
    else setPhase('quizIntro')
  }

  const confirmQuestion = () => finishQuestion(hintLevel > 0 ? 'hint' : 'ok')

  const onSuccess = () => {
    showFlash()
    if (phase === 'learn') nextLearn()
    else if (phase === 'quiz') confirmQuestion()
  }

  const { videoRef, canvasRef, status, error, live } = useHandTracking(cameraOn, target, onSuccess)

  const startLearning = () => {
    setPos(0)
    setPhase('learn')
  }

  const startQuiz = () => {
    setOrder(shuffle(signs))
    setQuestion(0)
    setHintLevel(0)
    setAnswers([])
    setPhase('quiz')
  }

  const inQuiz = phase === 'quiz'
  const detailed = !inQuiz || hintLevel > 0
  const score = live.match?.score ?? 0
  const feedback = current?.motion
    ? 'Ce signe comporte un mouvement : la caméra ne peut pas le vérifier. Fais-le, puis valide.'
    : target
      ? feedbackFor(live, flash, detailed)
      : ''

  return (
    <>
      {phase === 'intro' && (
        <section className="card intro">
          <h2>{lesson.title}</h2>
          <p className="lesson-letters">{lesson.subtitle}</p>
          <ol>
            <li>
              Tu fais les signes un par un, en regardant l'image, et tu recommences {REPETITIONS} fois la série. Tu
              peux passer au signe suivant quand tu veux.
            </li>
            <li>Ensuite, une petite interro : on te donne un signe à retrouver, sans image.</li>
            <li>Si tu bloques, tu peux demander un indice.</li>
          </ol>
          <p className="privacy">
            <strong>Ta vie privée :</strong> la caméra sert uniquement à repérer ta main. Ton visage et ton
            arrière-plan ne sont jamais affichés, et aucune image n'est enregistrée ni envoyée : tout se passe
            dans ton navigateur. Seul le tracé de ta main apparaît à l'écran.
          </p>
          <div className="actions center">
            <button type="button" className="primary" onClick={startLearning}>
              Commencer
            </button>
            <button type="button" onClick={onExit}>
              Retour au menu
            </button>
          </div>
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
            <button type="button" onClick={onExit}>
              Retour au menu
            </button>
          </div>
        </section>
      )}

      <div className="stage" hidden={!cameraOn}>
        <section className="card reference">
          {phase === 'learn' && current && (
            <>
              <h2>
                Tour {Math.floor(pos / signs.length) + 1} sur {REPETITIONS}
              </h2>
              <div className="chips" aria-label="Signes de ce tour">
                {signs.map((s, i) => {
                  const inRound = pos % signs.length
                  return (
                    <span key={s.id} className={i < inRound ? 'chip done' : i === inRound ? 'chip current' : 'chip'}>
                      {s.label}
                    </span>
                  )
                })}
              </div>
              <div className="sign-label">{current.label}</div>
              <Photo sign={current} />
              <p>{current.hint}</p>
              <div className="actions center">
                <button type="button" onClick={nextLearn}>
                  {current.motion ? "J'ai fait le signe" : 'Signe suivant'}
                </button>
              </div>
            </>
          )}

          {phase === 'quizIntro' && (
            <>
              <h2>Bravo, cours terminé !</h2>
              <p>
                Place à l'interro : {signs.length} signes dans le désordre. Les images sont cachées, mais tu peux
                demander un indice.
              </p>
              <button type="button" className="primary" onClick={startQuiz}>
                Démarrer l'interro
              </button>
            </>
          )}

          {inQuiz && current && (
            <>
              <h2>
                Question {question + 1} sur {order.length}
              </h2>
              <p>Fais le signe de</p>
              <div className="sign-label">{current.label}</div>
              {hintLevel >= 1 && <p className="hint">Indice : {current.hint}</p>}
              {hintLevel >= 2 && <Photo sign={current} />}
              <div className="actions center">
                {hintLevel < 2 && (
                  <button type="button" onClick={() => setHintLevel(hintLevel + 1)}>
                    {hintLevel === 0 ? 'Un indice ?' : 'Encore un indice'}
                  </button>
                )}
                {current.motion && (
                  <button type="button" onClick={confirmQuestion}>
                    J'ai fait le signe
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
          {detailed && target && (
            <div className="meter" aria-label="Précision du signe">
              <div
                className={`meter-bar ${score >= SUCCESS_SCORE ? 'good' : ''}`}
                style={{ width: `${Math.round(score * 100)}%` }}
              />
            </div>
          )}
          <p className="feedback" role="status">
            {feedback}
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
    </>
  )
}
