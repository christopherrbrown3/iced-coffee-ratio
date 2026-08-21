import { useEffect, useMemo, useRef, type MouseEvent } from 'react'
import { formatCoffee, type BrewResult, type BrewSettings } from '../domain/brew'
import { resolveTimerGuide } from '../domain/timerGuide'
import { formatCountdownTime, formatTime, useBrewTimer } from '../hooks/useBrewTimer'

interface TimerViewProps {
  settings: BrewSettings
  result: BrewResult
  onClose: (fromHistory?: boolean) => void
}

const measurementPattern = /(\d+(?:\.\d+)?(?:–\d+(?:\.\d+)?)?\s(?:g|mL|°C))/g

function EmphasizedInstruction({ text }: { text: string }) {
  return <>{text.split(measurementPattern).map((part, index) => (
    index % 2 === 1 ? <strong key={`${part}-${index}`}>{part}</strong> : part
  ))}</>
}

export function TimerView({ settings, result, onClose }: TimerViewProps) {
  const guide = useMemo(() => resolveTimerGuide(settings, result), [result, settings])
  const timedSeconds = guide.durationSeconds
  const steps = guide.steps
  const cueSeconds = useMemo(() => [...steps.map((step) => step.atSeconds), timedSeconds], [steps, timedSeconds])
  const timer = useBrewTimer(timedSeconds, cueSeconds)
  const resetTimer = timer.reset
  const headingRef = useRef<HTMLHeadingElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const activityRef = useRef({ running: timer.running, paused: timer.paused })
  const assetBase = import.meta.env.BASE_URL

  activityRef.current = { running: timer.running, paused: timer.paused }

  useEffect(() => {
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.icedCoffeeTimer) return
      const { running, paused } = activityRef.current
      if ((running || paused) && !window.confirm('Leave this brew and reset the timer?')) {
        window.history.pushState({ ...window.history.state, icedCoffeeTimer: true }, '')
        return
      }
      resetTimer()
      onClose(true)
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const { running, paused } = activityRef.current
      if (!running && !paused) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [onClose, resetTimer])

  const closeTimer = () => {
    if ((timer.running || timer.paused) && !window.confirm('Leave this brew and reset the timer?')) return
    timer.reset()
    onClose()
  }

  const focusTimer = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    mainRef.current?.focus()
  }

  const activeStep = steps[Math.max(0, Math.min(timer.cueIndex, steps.length - 1))]
  const displayCopy = timer.phase === 'ready'
    ? { eyebrow: 'Ready?', title: 'Set up the brew' }
    : timer.phase === 'timed'
      ? activeStep
      : timer.phase === 'release'
        ? guide.release
        : guide.complete
  const clockIsElapsed = timer.phase === 'release' || timer.phase === 'complete'
  const timeDisplay = clockIsElapsed
    ? formatTime(timer.releaseSeconds)
    : formatCountdownTime(timer.remainingSeconds)
  const clockLabel = `${timeDisplay} ${clockIsElapsed ? 'elapsed' : 'remaining'}${timer.paused ? ', paused' : ''}`
  const tone = timer.phase === 'timed' ? activeStep.tone : timer.phase

  return (
    <div className={`timer-view timer-view--${tone}`}>
      <a className="skip-link" href="#timer-main" onClick={focusTimer}>Skip to timer</a>
      <header className="timer-header">
        <button className="back-button" type="button" onClick={closeTimer}>← Calculator</button>
        <div className="mini-wordmark" aria-label="Iced Coffee Calculator">ICED COFFEE CALCULATOR</div>
        <label className="cue-toggle">
          <input type="checkbox" checked={timer.cuesEnabled} onChange={(event) => timer.setCuesEnabled(event.target.checked)} />
          <span>Sound + vibration</span>
        </label>
      </header>

      <main ref={mainRef} id="timer-main" className="timer-main" tabIndex={-1}>
        <section className="timer-stage">
          <div className="timer-stage__copy">
            <p className="comic-kicker">{displayCopy.eyebrow}</p>
            <h1 ref={headingRef} tabIndex={-1}>{displayCopy.title}</h1>
          </div>

          <div className="timer-clock" role="timer" aria-live="off" aria-label={clockLabel}>
            {timeDisplay}
          </div>

          <div className="timer-instruction" aria-live="polite" aria-atomic="true">
            {timer.phase === 'ready' && (
              <ol>
                {guide.readyInstructions.map((instruction, index) => (
                  <li key={`${index}-${instruction}`}><EmphasizedInstruction text={instruction} /></li>
                ))}
              </ol>
            )}
            {timer.phase === 'timed' && <p>{activeStep.instruction}</p>}
            {timer.phase === 'release' && <p>{guide.release.instruction}</p>}
            {timer.phase === 'complete' && <p>{guide.complete.instruction}</p>}
          </div>

          <div className="timer-actions">
            {timer.phase === 'ready' && <button className="primary-action" type="button" onClick={timer.start}>START BREW</button>}
            {timer.phase === 'timed' && (
              <button className="secondary-action" type="button" onClick={timer.paused ? timer.resume : timer.pause}>
                {timer.paused ? 'RESUME' : 'PAUSE'}
              </button>
            )}
            {timer.phase === 'release' && (
              <>
                <button className="primary-action" type="button" onClick={timer.finish}>{guide.release.buttonLabel}</button>
                <button className="secondary-action" type="button" onClick={timer.paused ? timer.resume : timer.pause}>
                  {timer.paused ? 'RESUME' : 'PAUSE'}
                </button>
              </>
            )}
            {timer.phase === 'complete' && <button className="primary-action" type="button" onClick={timer.reset}>BREW AGAIN</button>}
          </div>
        </section>

        <aside className="timer-recipe" aria-label="Current recipe">
          <img src={`${assetBase}graphics/coffee-cup-mascots.png`} width="900" height="600" alt="" loading="lazy" decoding="async" />
          <dl>
            <div><dt>Coffee</dt><dd>{formatCoffee(result.coffeeGrams)} g</dd></div>
            <div><dt>Hot water</dt><dd>{result.hotWaterMl} mL</dd></div>
            <div><dt>Ice</dt><dd>{result.iceGrams} g</dd></div>
          </dl>
        </aside>
      </main>
    </div>
  )
}
