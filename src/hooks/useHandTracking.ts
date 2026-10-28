import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import { drawHand } from '../lib/drawHand'
import { createHandTracker } from '../lib/handTracker'
import { fingerValues, matchHands, normalize, type DetectedHand, type FingerValues, type Match } from '../lib/landmarks'
import { detectMotion, toHandPoint, WINDOW_MS, type Sample } from '../lib/motion'
import type { Sign } from '../lib/signs'

/** Score à partir duquel le signe est considéré comme juste. */
export const SUCCESS_SCORE = 0.7
/** Nombre d'images consécutives à tenir pour valider (environ une demi-seconde). */
const SUCCESS_FRAMES = 15
/** En dessous de ce score, on considère que le signe est relâché : une nouvelle validation devient possible. */
const RELEASE_SCORE = 0.4
/** Après un mouvement validé, on attend un peu avant d'en accepter un autre. */
const MOTION_COOLDOWN_MS = 1200
/** Durée de la trajectoire dessinée à l'écran. */
const TRAIL_MS = 1500

export type Status = 'idle' | 'loading' | 'ready' | 'error'

export interface Live {
  hand: boolean
  match: Match | null
  /** Dépliement de chaque doigt de la première main vue, même quand aucun signe n'est comparé. */
  values: FingerValues | null
}

/**
 * Suit la main à la webcam. L'image de la caméra n'est jamais affichée : la vidéo reste cachée
 * et seul le tracé de la main est dessiné sur le canvas.
 */
export function useHandTracking(enabled: boolean, target: Sign | null, onSuccess: () => void) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetRef = useRef(target)
  const onSuccessRef = useRef(onSuccess)
  const armedRef = useRef(true)
  const goodFramesRef = useRef(0)
  const samplesRef = useRef<Sample[]>([])
  const lastMotionRef = useRef(0)

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  // Format réel de l'image de la caméra : la zone de la main l'épouse pour montrer toute la scène, sans rognage.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [live, setLive] = useState<Live>({ hand: false, match: null, values: null })

  useEffect(() => {
    targetRef.current = target
    onSuccessRef.current = onSuccess
  })

  // Nouveau signe demandé : on repart de zéro.
  const targetId = target?.id
  useEffect(() => {
    armedRef.current = true
    goodFramesRef.current = 0
    samplesRef.current = []
    lastMotionRef.current = performance.now()
  }, [targetId])

  useEffect(() => {
    if (!enabled) return
    let stop = false
    let frame = 0
    let stream: MediaStream | undefined
    let tracker: HandLandmarker | undefined

    async function start() {
      setStatus('loading')
      try {
        // Image large : beaucoup de webcams n'obtiennent le 4:3 qu'en rognant le centre, ce qui zoome sur la scène.
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        if (video.videoWidth > 0 && video.videoHeight > 0) setSize({ width: video.videoWidth, height: video.videoHeight })
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
            const now = performance.now()
            const result = tracker!.detectForVideo(video, now)
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const detected: DetectedHand[] = result.landmarks.map((landmarks, i) => {
              drawHand(ctx, landmarks, canvas.width, canvas.height)
              drawing.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#c9fbff', lineWidth: 4 })
              drawing.drawLandmarks(landmarks, { color: '#ffffff', fillColor: '#6ef3ff', radius: 5 })
              const handedness = result.handedness[i][0].categoryName as 'Left' | 'Right'
              return { landmarks, shape: normalize(landmarks, handedness) }
            })

            // Mémoire des positions : sert à reconnaître les mouvements.
            const samples = samplesRef.current
            if (detected.length > 0) {
              samples.push({ t: now, hands: detected.map((h) => toHandPoint(h.landmarks)) })
              while (samples.length > 0 && now - samples[0].t > WINDOW_MS) samples.shift()
            } else {
              samples.length = 0
            }

            if (detected.length > 0) {
              const t = targetRef.current
              if (t) {
                const match = t.ignoreShape ? null : matchHands(detected, t)

                if (t.move) {
                  drawTrail(ctx, samples, now, canvas.width, canvas.height)
                  const shapeOk = !match || match.score >= SUCCESS_SCORE
                  if (shapeOk && now - lastMotionRef.current > MOTION_COOLDOWN_MS && detectMotion(samples, t.move, now)) {
                    lastMotionRef.current = now
                    samples.length = 0
                    onSuccessRef.current()
                  }
                } else if (match) {
                  if (match.score < RELEASE_SCORE) armedRef.current = true
                  goodFramesRef.current = armedRef.current && match.score >= SUCCESS_SCORE ? goodFramesRef.current + 1 : 0
                  if (goodFramesRef.current >= SUCCESS_FRAMES) {
                    armedRef.current = false
                    goodFramesRef.current = 0
                    onSuccessRef.current()
                  }
                }
                setLive({ hand: true, match, values: fingerValues(detected[0].shape) })
              } else {
                setLive({ hand: true, match: null, values: fingerValues(detected[0].shape) })
              }
            } else {
              armedRef.current = true
              goodFramesRef.current = 0
              setLive({ hand: false, match: null, values: null })
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
  }, [enabled])

  const aspect = size ? size.width / size.height : 4 / 3
  return { videoRef, canvasRef, status, error, live, aspect, size }
}

/** Dessine la trajectoire récente de la main : l'élève voit ce que la caméra suit. */
function drawTrail(ctx: CanvasRenderingContext2D, samples: Sample[], now: number, width: number, height: number) {
  const points = samples.filter((s) => now - s.t <= TRAIL_MS && s.hands.length > 0).map((s) => s.hands[0])
  if (points.length < 2) return
  ctx.save()
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x * width, p.y * height) : ctx.lineTo(p.x * width, p.y * height)))
  ctx.stroke()
  ctx.restore()
}
