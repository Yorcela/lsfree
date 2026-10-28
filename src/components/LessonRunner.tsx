import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { SUCCESS_SCORE, useHandTracking, type Live } from '../hooks/useHandTracking'
import type { Lesson } from '../lib/lessons'
import { HandIllustration } from './HandIllustration'
import { HandSprite } from './HandSprite'
import { Mascot, type Mood } from './Mascot'
import { ProgressBar } from './ProgressBar'
import { SignDiagram } from './SignDiagram'
import { Stars } from './Stars'
import { starsFor, type Answer, type Outcome } from '../lib/scoring'
import { HAND_SPRITES, REPETITIONS, type Sign } from '../lib/signs'

type Phase = 'intro' | 'learn' | 'countdown' | 'quiz' | 'result'

const FINGER_NAMES = ['pouce', 'index', 'majeur', 'annulaire', 'auriculaire']

const OUTCOME_LABEL: Record<Outcome, string> = {
  ok: 'Réussi seul',
  hint: 'Réussi avec indice',
  skipped: 'Passé',
}

/** Humeur de la mascotte à la fin de l'interro : amoureuse pour 3 étoiles, fière pour 2, puis déçue ou découragée. */
function resultMood(answers: Answer[]): Mood {
  const stars = starsFor(answers)
  if (stars === 3) return 'amoureux'
  if (stars === 2) return 'fier'
  const ok = answers.filter((a) => a.outcome === 'ok').length
  return ok / (answers.length || 1) >= 0.25 ? 'decu' : 'decourage'
}

const RESULT_LINE: Record<number, string> = {
  3: 'Parfait ! Tu maîtrises ces signes.',
  2: "Bien joué ! Encore un peu d'entraînement et ce sera parfait.",
  1: "L'interro est finie. Revois le cours, tu vas y arriver !",
  0: "Presque aucun signe réussi cette fois : revois le cours et réessaie, aucune étoile n'est gagnée sans signe réussi.",
}

/** La phrase de fin de la mascotte ; un quiz sans cours renvoie vers les leçons. */
const resultLine = (stars: number, quizOnly?: boolean) =>
  RESULT_LINE[stars].replaceAll('le cours', quizOnly ? 'les leçons' : 'le cours')

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
  if (sign.diagram) return <SignDiagram sign={sign} />
  if (sign.hands) return <HandIllustration sign={sign} />
  if (HAND_SPRITES.has(sign.id)) return <HandSprite sign={sign} />
  return (
    <img
      className="sign-image"
      src={`./signs/${sign.id}.jpg`}
      alt={`Signe de la lettre ${sign.label}`}
      onError={(e) => (e.currentTarget.style.display = 'none')}
    />
  )
}

/** Les mots sont plus longs qu'une lettre : on réduit la taille d'affichage. */
const signLabelClass = (sign: Sign) => (sign.label.length > 3 ? 'sign-label word' : 'sign-label')

function feedbackFor(live: Live, flash: boolean, detailed: boolean): string {
  if (flash) return 'Bravo !'
  if (!live.hand) return 'Montre ta main devant la caméra.'
  const m = live.match
  if (!m) return ''
  if (m.score >= SUCCESS_SCORE) return 'Parfait, garde la position !'
  if (!detailed) return m.score >= 0.5 ? 'Presque !' : "Ce n'est pas encore ça."
  return m.advice
}

/** Petit projecteur dessiné : la main semble projetée en hologramme au-dessus de lui. */
function Projector() {
  return (
    <svg className="holo-base" viewBox="0 0 200 64" aria-hidden="true">
      <ellipse className="thruster" cx="64" cy="58" rx="16" ry="4" />
      <ellipse className="thruster" cx="136" cy="58" rx="16" ry="4" />
      <ellipse className="emitter" cx="100" cy="14" rx="58" ry="7" />
      <rect className="pod" x="14" y="26" width="16" height="18" rx="6" />
      <rect className="pod" x="170" y="26" width="16" height="18" rx="6" />
      <rect className="body" x="26" y="16" width="148" height="34" rx="13" />
      <rect className="window-frame" x="46" y="23" width="108" height="20" rx="7" />
      <rect className="window" x="50" y="26" width="100" height="14" rx="5" />
    </svg>
  )
}

interface Props {
  lesson: Lesson
  onExit: () => void
  onFinished: (lessonId: string, stars: number) => void
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
  const [count, setCount] = useState(3)
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<number | undefined>(undefined)

  const current = phase === 'learn' ? learnSequence[pos] : phase === 'quiz' ? order[question] : undefined
  // Un signe à mouvement sans suivi prévu se valide à la main ; sinon la caméra le suit.
  const target = current && (!current.motion || current.move) ? current : null
  const cameraOn = phase === 'learn' || phase === 'countdown' || phase === 'quiz'

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  useEffect(() => {
    if (phase === 'result') onFinished(lesson.id, starsFor(answers))
  }, [phase, answers, lesson.id, onFinished])

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
    else {
      setCount(3)
      setPhase('countdown')
    }
  }

  const confirmQuestion = () => finishQuestion(hintLevel > 0 ? 'hint' : 'ok')

  const onSuccess = () => {
    showFlash()
    if (phase === 'learn') nextLearn()
    else if (phase === 'quiz') confirmQuestion()
  }

  const { videoRef, canvasRef, status, error, live, aspect, size } = useHandTracking(cameraOn, target, onSuccess)

  const startLearning = () => {
    setPos(0)
    setPhase('learn')
  }

  // Un quiz sans cours part directement sur le décompte ; sinon on commence par l'apprentissage.
  const begin = () => {
    if (lesson.quizOnly) {
      setCount(3)
      setPhase('countdown')
    } else {
      startLearning()
    }
  }

  const startQuiz = useCallback(() => {
    setOrder(shuffle(signs))
    setQuestion(0)
    setHintLevel(0)
    setAnswers([])
    setPhase('quiz')
  }, [signs])

  // Décompte 3, 2, 1, puis « QUIZZ ! » (count = 0) avant de lancer l'interro toute seule.
  useEffect(() => {
    if (phase !== 'countdown') return
    const timer = window.setTimeout(() => (count > 0 ? setCount(count - 1) : startQuiz()), 1000)
    return () => window.clearTimeout(timer)
  }, [phase, count, startQuiz])

  const inQuiz = phase === 'quiz'
  const detailed = !inQuiz || hintLevel > 0
  const score = live.match?.score ?? 0
  const feedback = current?.motion
    ? flash
      ? 'Bravo !'
      : !current.move
        ? 'Ce signe comporte un mouvement : la caméra ne peut pas le vérifier. Fais-le, puis valide.'
        : live.hand
          ? "Fais le geste, la caméra le suit (trait orange). Si elle ne le voit pas, clique sur « J'ai fait le signe »."
          : 'Montre ta main devant la caméra.'
    : target
      ? feedbackFor(live, flash, detailed)
      : ''

  const learnMood: Mood = flash ? 'fier' : live.hand && live.match && live.match.score < 0.5 ? 'inquiet' : 'heureux'
  const quizMood: Mood = flash ? 'fier' : hintLevel > 0 ? 'decu' : 'anxieux'

  return (
    <>
      {phase === 'intro' && (
        <section className="card intro">
          <h2>{lesson.title}</h2>
          <p className="lesson-letters">{lesson.subtitle}</p>
          <Mascot mood={lesson.quizOnly ? 'anxieux' : 'heureux'}>
            {lesson.quizOnly
              ? "Le grand quiz ! Tu as tout appris, montre-moi que tu t'en souviens."
              : 'Salut ! On va apprendre ça ensemble : fais chaque signe devant la caméra, je te dis lequel.'}
          </Mascot>
          {lesson.quizOnly ? (
            <p>
              Les {signs.length} signes dans le désordre, sans image : à toi de les retrouver. Si tu bloques, tu peux
              demander un indice ou passer au suivant.
            </p>
          ) : (
            <ol>
              <li>
                Tu fais les signes un par un, en regardant l'image, et tu recommences {REPETITIONS} fois la série. Tu
                peux passer au signe suivant quand tu veux.
              </li>
              <li>Ensuite, une petite interro : on te donne un signe à retrouver, sans image.</li>
              <li>Si tu bloques, tu peux demander un indice.</li>
            </ol>
          )}
          <div className="actions center">
            <button type="button" className="primary" onClick={begin}>
              Commencer
            </button>
            <button type="button" className="ghost" onClick={onExit}>
              Retour au menu
            </button>
          </div>
        </section>
      )}

      {phase === 'result' && (
        <section className="card result">
          <h2>Interro terminée !</h2>
          <Stars count={starsFor(answers)} size={56} />
          <Mascot mood={resultMood(answers)}>{resultLine(starsFor(answers), lesson.quizOnly)}</Mascot>
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
            {!lesson.quizOnly && (
              <button type="button" className="ghost" onClick={startLearning}>
                Revoir le cours
              </button>
            )}
            <button type="button" className="ghost" onClick={onExit}>
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
              <ProgressBar value={pos / learnSequence.length} label="Progression de la leçon" />
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
              <div className={signLabelClass(current)}>{current.label}</div>
              <Photo sign={current} />
              <Mascot mood={learnMood}>
                {flash ? (
                  'Bravo !'
                ) : (
                  <>
                    Fais le signe « {current.label} » : {current.hint}
                  </>
                )}
              </Mascot>
              <div className="actions center">
                <button type="button" className={current.motion ? undefined : 'ghost'} onClick={nextLearn}>
                  {current.motion ? "J'ai fait le signe" : 'Signe suivant'}
                </button>
              </div>
            </>
          )}

          {phase === 'countdown' && (
            <>
              <h2>{lesson.quizOnly ? 'Le grand quiz !' : 'Cours terminé !'}</h2>
              <div className={count > 0 ? 'countdown' : 'countdown quizz'} key={count} role="timer" aria-live="assertive">
                {count > 0 ? count : 'QUIZZ !'}
              </div>
              <Mascot mood={count > 0 ? 'anxieux' : 'fier'}>
                {count > 0
                  ? `Respire, l'interro démarre : ${signs.length} signes dans le désordre, sans image !`
                  : 'Go ! Montre-moi ce que tu sais faire.'}
              </Mascot>
            </>
          )}

          {inQuiz && current && (
            <>
              <h2>
                Question {question + 1} sur {order.length}
              </h2>
              <ProgressBar value={question / order.length} label="Progression de l'interro" />
              <p>Fais le signe de</p>
              <div className={signLabelClass(current)}>{current.label}</div>
              <Mascot mood={quizMood}>
                {flash ? (
                  'Bravo !'
                ) : hintLevel >= 1 ? (
                  <>Indice : {current.hint}</>
                ) : (
                  'À toi ! Montre-moi le signe.'
                )}
              </Mascot>
              {hintLevel >= 2 && <Photo sign={current} />}
              <div className="actions center">
                {hintLevel < 2 && (
                  <button type="button" className="warn" onClick={() => setHintLevel(hintLevel + 1)}>
                    {hintLevel === 0 ? 'Un indice ?' : 'Encore un indice'}
                  </button>
                )}
                {current.motion && (
                  <button type="button" onClick={confirmQuestion}>
                    J'ai fait le signe
                  </button>
                )}
                <button type="button" className="ghost" onClick={() => finishQuestion('skipped')}>
                  Passer
                </button>
              </div>
            </>
          )}
        </section>

        <section className="card camera">
          <div className="holo-row">
            <div className="hand-wrap" style={{ aspectRatio: aspect, '--aspect': aspect } as CSSProperties}>
              {/* Invisible, y compris si la feuille de style n'est pas chargée : seule la main est tracée. */}
              <video
                ref={videoRef}
                className="hidden-video"
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                playsInline
                muted
              />
              <div className="holo-beam" />
              <canvas ref={canvasRef} />
              <div className="scanlines" />
              <Projector />
              {status === 'loading' && <div className="overlay">Chargement du suivi de la main…</div>}
              {status === 'error' && <div className="overlay error">Caméra indisponible : {error}</div>}
            </div>

            <div className="debug">
              <p className="debug-title">Ce que la caméra voit</p>
              {size && (
                <p className="debug-meta">
                  Image reçue : {size.width} × {size.height}
                </p>
              )}
              {FINGER_NAMES.map((name, i) => {
                const percent = Math.round((live.values?.[i] ?? 0) * 100)
                return (
                  <div key={name} className="debug-row">
                    <span className="debug-name">{name}</span>
                    <span className="debug-value">{percent} %</span>
                    <div className="meter">
                      <div className="meter-bar" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {detailed && target && !current?.motion && (
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
        </section>
      </div>
    </>
  )
}
