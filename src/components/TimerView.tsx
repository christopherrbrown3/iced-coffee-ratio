import { getBrewer, getSteepSeconds, type BrewResult, type BrewSettings } from '../domain/brew'
import { formatTime, useBrewTimer, type TimerStage } from '../hooks/useBrewTimer'

interface TimerViewProps {
  settings: BrewSettings
  result: BrewResult
  onClose: () => void
}

const STAGE_COPY: Record<TimerStage, { eyebrow: string; title: string }> = {
  ready: { eyebrow: 'Ready?', title: 'Set the scene' },
  steep: { eyebrow: 'Steep', title: 'Mix, then let it mingle' },
  ice: { eyebrow: 'Almost!', title: 'Ice in the carafe' },
  drawdown: { eyebrow: 'Release', title: 'Let it rain' },
  complete: { eyebrow: 'Ta-da!', title: 'Stir, pour, enjoy' },
}

export function TimerView({ settings, result, onClose }: TimerViewProps) {
  const brewer = getBrewer(settings.brewerId)
  const steepSeconds = getSteepSeconds(settings.roast)
  const timer = useBrewTimer(steepSeconds)
  const copy = STAGE_COPY[timer.stage]
  const assetBase = import.meta.env.BASE_URL

  const closeTimer = () => {
    if ((timer.running || timer.paused) && !window.confirm('Leave this brew and reset the timer?')) return
    timer.reset()
    onClose()
  }

  const timeDisplay = timer.stage === 'drawdown' || timer.stage === 'complete'
    ? formatTime(timer.drawdownSeconds)
    : formatTime(timer.remainingSeconds)

  return (
    <div className={`timer-view timer-view--${timer.stage}`}>
      <a className="skip-link" href="#timer-main">Skip to timer</a>
      <header className="timer-header">
        <button className="back-button" type="button" onClick={closeTimer}>← Calculator</button>
        <div className="mini-wordmark" aria-label="Ratio Hero">RATIO HERO</div>
        <label className="cue-toggle">
          <input type="checkbox" checked={timer.cuesEnabled} onChange={(event) => timer.setCuesEnabled(event.target.checked)} />
          Cues
        </label>
      </header>

      <main id="timer-main" className="timer-main">
        <section className="timer-stage" aria-live="polite">
          <div className="timer-stage__copy">
            <p className="comic-kicker">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
          </div>

          <div className="timer-clock" aria-label={`${timeDisplay} ${timer.stage === 'drawdown' ? 'drawdown elapsed' : 'remaining'}`}>
            {timeDisplay}
          </div>

          <div className="timer-instruction">
            {timer.stage === 'ready' && (
              <ol>
                <li>Preheat the {brewer.shortName} and rinse the filter.</li>
                <li>Add <strong>{result.hotWaterMl} mL</strong> hot water, then <strong>{result.coffeeGrams} g</strong> coffee.</li>
                <li>Mix thoroughly—no dry pockets.</li>
                <li>Keep <strong>{result.iceGrams} g</strong> ice in the freezer until the cue.</li>
              </ol>
            )}
            {timer.stage === 'steep' && <p>Let the coffee steep. Give it one gentle stir if any grounds remain dry.</p>}
            {timer.stage === 'ice' && <p>Weigh <strong>{result.iceGrams} g ice</strong> straight from the freezer into your carafe.</p>}
            {timer.stage === 'drawdown' && <p>{brewer.releaseInstruction}</p>}
            {timer.stage === 'complete' && <p>Stir until most of the ice has melted, then serve over fresh ice.</p>}
          </div>

          <div className="timer-actions">
            {timer.stage === 'ready' && <button className="primary-action" type="button" onClick={timer.start}>START STEEP</button>}
            {(timer.stage === 'steep' || timer.stage === 'ice') && (
              <button className="secondary-action" type="button" onClick={timer.paused ? timer.resume : timer.pause}>
                {timer.paused ? 'RESUME' : 'PAUSE'}
              </button>
            )}
            {timer.stage === 'drawdown' && (
              <>
                <button className="primary-action" type="button" onClick={timer.finish}>DRAW-DOWN DONE</button>
                <button className="secondary-action" type="button" onClick={timer.paused ? timer.resume : timer.pause}>
                  {timer.paused ? 'RESUME' : 'PAUSE'}
                </button>
              </>
            )}
            {timer.stage === 'complete' && <button className="primary-action" type="button" onClick={timer.reset}>BREW AGAIN</button>}
          </div>
        </section>

        <aside className="timer-recipe" aria-label="Current recipe">
          <img src={`${assetBase}graphics/ratio-hero-mascot.png`} alt="Cheerful illustrated ice cube pointing toward the brew" />
          <dl>
            <div><dt>Coffee</dt><dd>{result.coffeeGrams} g</dd></div>
            <div><dt>Hot water</dt><dd>{result.hotWaterMl} mL</dd></div>
            <div><dt>Ice</dt><dd>{result.iceGrams} g</dd></div>
          </dl>
        </aside>
      </main>
    </div>
  )
}
