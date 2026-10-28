import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import { createHandTracker } from './lib/handTracker'
import { normalize, score, type HandShape } from './lib/landmarks'
import { loadTemplates, saveTemplate, SIGNS } from './lib/templates'

const SUCCESS_SCORE = 0.8
const SUCCESS_FRAMES = 15

type Status = 'loading' | 'ready' | 'error'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shapeRef = useRef<HandShape | null>(null)
  const goodFramesRef = useRef(0)

  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState(loadTemplates)
  const [index, setIndex] = useState(0)
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [done, setDone] = useState<string[]>([])

  const sign = SIGNS[index % SIGNS.length]
  const template = templates[sign.id]

  const next = () => {
    goodFramesRef.current = 0
    setCurrentScore(null)
    setIndex((i) => i + 1)
  }

  // La boucle de détection vit dans un effet unique : elle lit l'état courant via ces refs.
  const templateRef = useRef(template)
  const onSuccessRef = useRef(() => {})
  useEffect(() => {
    templateRef.current = template
    onSuccessRef.current = () => {
      setDone((d) => (d.includes(sign.id) ? d : [...d, sign.id]))
      next()
    }
  })

  useEffect(() => {
    let stop = false
    let frame = 0
    let stream: MediaStream | undefined
    let tracker: HandLandmarker | undefined

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        tracker = await createHandTracker()
        if (stop) return
        setStatus('ready')

        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        const drawing = new DrawingUtils(ctx)
        let lastTime = -1

        const loop = () => {
          if (stop) return
          if (video.currentTime !== lastTime) {
            lastTime = video.currentTime
            const result = tracker!.detectForVideo(video, performance.now())
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const landmarks = result.landmarks[0]
            if (landmarks) {
              drawing.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#7c3aed', lineWidth: 3 })
              drawing.drawLandmarks(landmarks, { color: '#fff', radius: 3 })
              const handedness = result.handedness[0][0].categoryName as 'Left' | 'Right'
              shapeRef.current = normalize(landmarks, handedness)
              if (templateRef.current) {
                const s = score(shapeRef.current, templateRef.current)
                setCurrentScore(s)
                goodFramesRef.current = s >= SUCCESS_SCORE ? goodFramesRef.current + 1 : 0
                if (goodFramesRef.current >= SUCCESS_FRAMES) onSuccessRef.current()
              }
            } else {
              shapeRef.current = null
              goodFramesRef.current = 0
              setCurrentScore(null)
            }
          }
          frame = requestAnimationFrame(loop)
        }
        loop()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        setStatus('error')
      }
    }

    start()
    return () => {
      stop = true
      cancelAnimationFrame(frame)
      tracker?.close()
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const calibrate = () => {
    if (shapeRef.current) setTemplates(saveTemplate(sign.id, shapeRef.current))
  }

  const feedback = !template
    ? 'Pas encore de modèle pour ce signe : fais le signe devant la caméra puis clique sur « Enregistrer comme modèle ».'
    : currentScore === null
      ? 'Montre ta main à la caméra.'
      : currentScore >= SUCCESS_SCORE
        ? 'Parfait, garde la position !'
        : currentScore >= 0.5
          ? 'Presque ! Ajuste la position des doigts.'
          : "Ce n'est pas encore ça, regarde bien le signe."

  return (
    <main className="app">
      <h1>LSF Free</h1>
      <p className="subtitle">Apprends la langue des signes française avec ta webcam.</p>

      <div className="stage">
        <section className="card reference">
          <h2>Signe à faire</h2>
          <div className="sign-label">{sign.label}</div>
          <img
            className="sign-image"
            src={`./signs/${sign.id}.jpg`}
            alt={`Signe ${sign.label}`}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <p>{sign.hint}</p>
        </section>

        <section className="card camera">
          <div className="video-wrap">
            <video ref={videoRef} playsInline muted />
            <canvas ref={canvasRef} />
            {status === 'loading' && <div className="overlay">Chargement de la caméra et du modèle…</div>}
            {status === 'error' && <div className="overlay error">Caméra indisponible : {error}</div>}
          </div>
          <div className="meter" aria-label="Score">
            <div
              className={`meter-bar ${currentScore !== null && currentScore >= SUCCESS_SCORE ? 'good' : ''}`}
              style={{ width: `${Math.round((currentScore ?? 0) * 100)}%` }}
            />
          </div>
          <p className="feedback" role="status">{feedback}</p>
          <div className="actions">
            <button type="button" onClick={calibrate} disabled={status !== 'ready'}>
              Enregistrer comme modèle
            </button>
            <button type="button" onClick={next}>Signe suivant</button>
          </div>
        </section>
      </div>

      <p className="progress">Réussis : {done.length} / {SIGNS.length}</p>

      <footer className="credits">
        Photos des lettres : Wikimedia Commons (« LSF Lettre A/B/L/Y »), sous licence{' '}
        <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr" target="_blank" rel="noreferrer">
          CC BY-SA 3.0
        </a>
        .
      </footer>
    </main>
  )
}

export default App
