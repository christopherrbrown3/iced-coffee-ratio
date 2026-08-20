import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type TimerPhase = 'ready' | 'timed' | 'release' | 'complete'

function createCue() {
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) return null
  return new AudioContextClass()
}

export function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function useBrewTimer(timedSeconds: number, cueSeconds: number[] = []) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [pausedDuration, setPausedDuration] = useState(0)
  const [completedAtElapsed, setCompletedAtElapsed] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [cuesEnabled, setCuesEnabled] = useState(true)
  const audioRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const previousCueIndexRef = useRef(-1)

  const running = startedAt !== null && pausedAt === null && completedAtElapsed === null
  const activeNow = pausedAt ?? now
  const elapsedSeconds = completedAtElapsed ?? (startedAt === null ? 0 : Math.max(0, (activeNow - startedAt - pausedDuration) / 1000))
  const remainingSeconds = Math.max(0, timedSeconds - elapsedSeconds)

  const phase = useMemo<TimerPhase>(() => {
    if (startedAt === null) return 'ready'
    if (completedAtElapsed !== null) return 'complete'
    return elapsedSeconds < timedSeconds ? 'timed' : 'release'
  }, [completedAtElapsed, elapsedSeconds, startedAt, timedSeconds])

  const releaseSeconds = Math.max(0, elapsedSeconds - timedSeconds)
  const cueIndex = cueSeconds.reduce((latest, second, index) => elapsedSeconds >= second ? index : latest, -1)

  const playCue = useCallback(() => {
    if (!cuesEnabled) return
    const audio = audioRef.current
    if (audio) {
      void audio.resume().then(() => {
        const oscillator = audio.createOscillator()
        const gain = audio.createGain()
        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(540, audio.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(860, audio.currentTime + 0.18)
        gain.gain.setValueAtTime(0.0001, audio.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.24)
        oscillator.connect(gain).connect(audio.destination)
        oscillator.start()
        oscillator.stop(audio.currentTime + 0.25)
      })
    }
    if ('vibrate' in navigator) navigator.vibrate([70, 40, 70])
  }, [cuesEnabled])

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
    } catch {
      wakeLockRef.current = null
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release()
    } finally {
      wakeLockRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [running])

  useEffect(() => {
    if (cueIndex > previousCueIndexRef.current && previousCueIndexRef.current >= 0) playCue()
    previousCueIndexRef.current = cueIndex
  }, [cueIndex, playCue])

  useEffect(() => {
    if (running) void requestWakeLock()
    else void releaseWakeLock()
    return () => {
      void releaseWakeLock()
    }
  }, [releaseWakeLock, requestWakeLock, running])

  useEffect(() => {
    const handleVisibility = () => {
      setNow(Date.now())
      if (running && document.visibilityState === 'visible') void requestWakeLock()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [requestWakeLock, running])

  const start = useCallback(() => {
    audioRef.current ??= createCue()
    setStartedAt(Date.now())
    setPausedAt(null)
    setPausedDuration(0)
    setCompletedAtElapsed(null)
    setNow(Date.now())
    previousCueIndexRef.current = 0
  }, [])

  const pause = useCallback(() => {
    if (!running) return
    setPausedAt(Date.now())
  }, [running])

  const resume = useCallback(() => {
    if (pausedAt === null) return
    const resumedAt = Date.now()
    setPausedDuration((duration) => duration + resumedAt - pausedAt)
    setPausedAt(null)
    setNow(resumedAt)
  }, [pausedAt])

  const finish = useCallback(() => {
    if (startedAt === null) return
    setCompletedAtElapsed(elapsedSeconds)
    setPausedAt(null)
    playCue()
  }, [elapsedSeconds, playCue, startedAt])

  const reset = useCallback(() => {
    setStartedAt(null)
    setPausedAt(null)
    setPausedDuration(0)
    setCompletedAtElapsed(null)
    setNow(Date.now())
    previousCueIndexRef.current = -1
  }, [])

  return {
    phase,
    running,
    paused: pausedAt !== null,
    elapsedSeconds,
    remainingSeconds,
    releaseSeconds,
    cueIndex,
    cuesEnabled,
    setCuesEnabled,
    start,
    pause,
    resume,
    finish,
    reset,
  }
}
