import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import { drawHand } from '../lib/drawHand'
import { createHandTracker } from '../lib/handTracker'
import { matchHands, normalize, type DetectedHand, type Match } from '../lib/landmarks'
import type { Sign } from '../lib/signs'

/** Score à partir duquel le signe est considéré comme juste. */
export const SUCCESS_SCORE = 0.7
/** Nombre d'images consécutives à tenir pour valider (environ une demi-seconde). */
const SUCCESS_FRAMES = 15
/** En dessous de ce score, on considère que le signe est relâché : une nouvelle validation devient possible. */
const RELEASE_SCORE = 0.4

export type Status = 'idle' | 'loading' | 'ready' | 'error'

export interface Live {
  hand: boolean
  match: Match | null
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

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [live, setLive] = useState<Live>({ hand: false, match: null })

  useEffect(() => {
    targetRef.current = target
    onSuccessRef.current = onSuccess
  })

  // Nouveau signe demandé : on repart de zéro.
  const targetId = target?.id
  useEffect(() => {
    armedRef.current = true
    goodFramesRef.current = 0
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

            const detected: DetectedHand[] = result.landmarks.map((landmarks, i) => {
              drawHand(ctx, landmarks, canvas.width, canvas.height)
              drawing.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#7c3aed', lineWidth: 6 })
              drawing.drawLandmarks(landmarks, { color: '#ffffff', fillColor: '#7c3aed', radius: 5 })
              const handedness = result.handedness[i][0].categoryName as 'Left' | 'Right'
              return { landmarks, shape: normalize(landmarks, handedness) }
            })

            if (detected.length > 0) {

              const t = targetRef.current
              if (t) {
                const match = matchHands(detected, t)
                if (match.score < RELEASE_SCORE) armedRef.current = true
                goodFramesRef.current = armedRef.current && match.score >= SUCCESS_SCORE ? goodFramesRef.current + 1 : 0
                if (goodFramesRef.current >= SUCCESS_FRAMES) {
                  armedRef.current = false
                  goodFramesRef.current = 0
                  onSuccessRef.current()
                }
                setLive({ hand: true, match })
              } else {
                setLive({ hand: true, match: null })
              }
            } else {
              armedRef.current = true
              goodFramesRef.current = 0
              setLive({ hand: false, match: null })
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

  return { videoRef, canvasRef, status, error, live }
}
