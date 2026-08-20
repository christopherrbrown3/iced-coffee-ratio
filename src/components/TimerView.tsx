import { useEffect, useMemo, useRef, type MouseEvent } from 'react'
import { formatCoffee, getBrewer, getTimedBrewSeconds, type BrewResult, type BrewSettings } from '../domain/brew'
import { formatCountdownTime, formatTime, useBrewTimer } from '../hooks/useBrewTimer'

interface TimerViewProps {
  settings: BrewSettings
  result: BrewResult
  onClose: (fromHistory?: boolean) => void
}

interface TimedStep {
  atSeconds: number
  eyebrow: string
  title: string
  instruction: string
}

function scaledPour(hotWaterMl: number, sourceAmount: number) {
  return Math.round(hotWaterMl * sourceAmount / 335)
}

function getTimedSteps(settings: BrewSettings, result: BrewResult, timedSeconds: number): TimedStep[] {
  if (settings.method === 'flash') {
    const bloomTarget = Math.min(result.hotWaterMl, Math.max(1, Math.round(result.coffeeGrams)))
    const firstPourTarget = Math.max(bloomTarget, scaledPour(result.hotWaterMl, 100))
    const secondPourTarget = Math.max(firstPourTarget, scaledPour(result.hotWaterMl, 200))
    return [
      { atSeconds: 0, eyebrow: 'Bloom', title: 'Wake up the coffee', instruction: `Start the timer and bloom with ${bloomTarget} mL, wetting every ground.` },
      { atSeconds: 30, eyebrow: 'Pour', title: 'Circle to the first mark', instruction: `Pour in gentle circles until the scale reaches ${firstPourTarget} mL.` },
      { atSeconds: 60, eyebrow: 'Pour', title: 'Build the brew', instruction: `When the bed drops about 1 cm, pour in circles to ${secondPourTarget} mL.` },
      { atSeconds: 90, eyebrow: 'Pulse', title: 'Finish the pour', instruction: `Keep pulsing every 30 seconds as it drains, stopping at ${result.hotWaterMl} mL total hot water.` },
    ]
  }

  if (settings.method === 'aeropress') {
    return [
      { atSeconds: 0, eyebrow: 'Steep', title: 'Pour, stir, wait', instruction: `Add ${result.hotWaterMl} mL hot water, stir until every ground is wet, and steep for 1:30.` },
    ]
  }

  return [
    { atSeconds: 0, eyebrow: 'Steep', title: 'Mix, then let it mingle', instruction: 'Let the coffee steep. Give it one gentle stir if any grounds remain dry.' },
    { atSeconds: timedSeconds - 30, eyebrow: 'Almost!', title: 'Ice in the carafe', instruction: `Weigh ${result.iceGrams} g ice straight from the freezer into your carafe.` },
  ]
}

export function TimerView({ settings, result, onClose }: TimerViewProps) {
  const brewer = getBrewer(settings.brewerId)
  const timedSeconds = getTimedBrewSeconds(settings)
  const steps = useMemo(() => getTimedSteps(settings, result, timedSeconds), [result, settings, timedSeconds])
  const cueSeconds = useMemo(() => [...steps.map((step) => step.atSeconds), timedSeconds], [steps, timedSeconds])
  const timer = useBrewTimer(timedSeconds, cueSeconds)
  const resetTimer = timer.reset
  const headingRef = useRef<HTMLHeadingElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const activityRef = useRef({ running: timer.running, paused: timer.paused })
  const assetBase = import.meta.env.BASE_URL

  activityRef.current = { running: timer.running, paused: timer.paused }

  useEffect(() => {
    headingRef.current?.focus()
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
  const releaseCopy = settings.method === 'aeropress'
    ? { eyebrow: 'Press', title: 'Press it gently', instruction: brewer.releaseInstruction, button: 'PRESSING DONE' }
    : settings.method === 'flash'
      ? { eyebrow: 'Drain', title: 'Catch the last drops', instruction: brewer.releaseInstruction, button: 'DRAW-DOWN DONE' }
      : { eyebrow: 'Release', title: 'Let it rain', instruction: brewer.releaseInstruction, button: 'DRAW-DOWN DONE' }
  const displayCopy = timer.phase === 'ready'
    ? { eyebrow: 'Ready?', title: 'Set the scene' }
    : timer.phase === 'timed'
      ? activeStep
      : timer.phase === 'release'
        ? releaseCopy
        : { eyebrow: 'Ta-da!', title: 'Stir, pour, enjoy' }
  const clockIsElapsed = timer.phase === 'release' || timer.phase === 'complete'
  const timeDisplay = clockIsElapsed
    ? formatTime(timer.releaseSeconds)
    : formatCountdownTime(timer.remainingSeconds)
  const clockLabel = `${timeDisplay} ${clockIsElapsed ? 'elapsed' : 'remaining'}${timer.paused ? ', paused' : ''}`
  const tone = settings.method === 'immersion' && timer.phase === 'timed' && timer.cueIndex > 0 ? 'ice' : timer.phase

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
            {timer.phase === 'ready' && settings.method === 'immersion' && (
              <ol>
                <li>{brewer.setupInstruction}</li>
                <li>{settings.brewerId === 'pulsar' ? `Pour ${result.hotWaterMl} mL through the cap and agitate gently.` : `Add ${result.hotWaterMl} mL hot water, then ${result.coffeeGrams} g coffee.`}</li>
                <li>Mix thoroughly—no dry pockets.</li>
                <li>Keep {result.iceGrams} g ice in the freezer until the cue.</li>
              </ol>
            )}
            {timer.phase === 'ready' && settings.method === 'flash' && (
              <ol>
                <li>Add <strong>{result.iceGrams} g ice</strong> to the carafe.</li>
                <li>{brewer.setupInstruction}</li>
                <li>Add <strong>{result.coffeeGrams} g</strong> medium-fine coffee.</li>
              </ol>
            )}
            {timer.phase === 'ready' && settings.method === 'aeropress' && (
              <ol>
                <li>Add <strong>{result.iceGrams} g ice</strong> to a sturdy tumbler.</li>
                <li>{brewer.setupInstruction}</li>
                <li>Use the {settings.roast === 'dark' ? 'cooler' : settings.roast === 'light' ? 'hotter' : 'middle'} end of the 88–96 °C range.</li>
                <li>Set the AeroPress on the tumbler and add <strong>{result.coffeeGrams} g</strong> medium-fine coffee.</li>
              </ol>
            )}
            {timer.phase === 'timed' && <p>{activeStep.instruction}</p>}
            {timer.phase === 'release' && <p>{releaseCopy.instruction}</p>}
            {timer.phase === 'complete' && <p>Stir until most of the brew ice has melted, then serve over fresh ice.</p>}
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
                <button className="primary-action" type="button" onClick={timer.finish}>{releaseCopy.button}</button>
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
