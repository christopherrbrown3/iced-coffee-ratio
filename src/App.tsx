import { useMemo, useState } from 'react'
import { BREWERS, DEFAULT_SETTINGS, SOURCE_BATCHES, calculateBrew, formatCoffee, formatRatio, getBrewer, getCapacityWarning, type BrewSettings, type RoastLevel } from './domain/brew'
import { usePersistentSettings } from './hooks/usePersistentSettings'
import { Stepper } from './components/Stepper'
import { TimerView } from './components/TimerView'

type AppView = 'calculator' | 'timer'

export function App() {
  const [settings, setSettings] = usePersistentSettings()
  const [view, setView] = useState<AppView>('calculator')
  const [copyStatus, setCopyStatus] = useState('')
  const [recipeId, setRecipeId] = useState('hoffmann')
  const result = useMemo(() => calculateBrew(settings), [settings])
  const capacityWarning = useMemo(() => getCapacityWarning(settings), [settings])
  const brewer = getBrewer(settings.brewerId)
  const assetBase = import.meta.env.BASE_URL

  const update = <K extends keyof BrewSettings>(key: K, value: BrewSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
    if (key === 'ratio' || key === 'icePercent') setRecipeId('custom')
  }

  const selectRecipe = (id: string) => {
    setRecipeId(id)
    if (id === 'hoffmann') {
      setSettings((current) => ({ ...current, ratio: DEFAULT_SETTINGS.ratio, icePercent: DEFAULT_SETTINGS.icePercent }))
    }
  }

  const scaleToFit = () => {
    const maxTotal = Math.floor(brewer.capacityMl / (1 - settings.icePercent / 100))
    update('totalWaterMl', maxTotal)
  }

  const copyRecipe = async () => {
    const text = `Ratio Hero — ${formatCoffee(result.coffeeGrams)} g coffee, ${result.hotWaterMl} mL hot water, ${result.iceGrams} g ice. 1:${formatRatio(settings.ratio)} total-water ratio, ${settings.icePercent}% ice, ${brewer.name}.`
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('Recipe copied!')
    } catch {
      setCopyStatus('Copy unavailable—select the quantities above.')
    }
    window.setTimeout(() => setCopyStatus(''), 2500)
  }

  if (view === 'timer') {
    return <TimerView settings={settings} result={result} onClose={() => setView('calculator')} />
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to calculator</a>
      <header className="masthead">
        <div className="masthead__text">
          <h1>RATIO HERO</h1>
        </div>
        <img src={`${assetBase}graphics/ratio-hero-pour.png`} alt="Illustrated iced coffee splashing into a glass" />
      </header>

      <main id="main-content" className="comic-layout">
        <section className="comic-panel comic-panel--pick" aria-labelledby="pick-title">
          <div className="panel-heading">
            <span aria-hidden="true">1.</span>
            <h2 id="pick-title">Pick</h2>
          </div>
          <div className="pick-fields">
            <label className="select-field">
              <span>Recipe</span>
              <select value={recipeId} onChange={(event) => selectRecipe(event.target.value)}>
                <option value="hoffmann">Hoffmann iced immersion</option>
                <option value="custom">Custom iced immersion</option>
              </select>
            </label>
            <label className="select-field">
              <span>Brewer</span>
              <select value={settings.brewerId} onChange={(event) => update('brewerId', event.target.value as BrewSettings['brewerId'])}>
                {BREWERS.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
          </div>
          <fieldset className="roast-field">
            <legend>Roast</legend>
            <div className="roast-options">
              {(['light', 'medium', 'dark'] as RoastLevel[]).map((roast) => (
                <label key={roast}>
                  <input type="radio" name="roast" value={roast} checked={settings.roast === roast} onChange={() => update('roast', roast)} />
                  <span>{roast}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="comic-panel comic-panel--tune" aria-labelledby="tune-title">
          <div className="panel-heading">
            <span aria-hidden="true">2.</span>
            <h2 id="tune-title">Tune</h2>
          </div>

          <div className="batch-presets" aria-label="Quick batch sizes">
            {SOURCE_BATCHES.slice(0, 3).map((amount, index) => (
              <button key={amount} type="button" aria-pressed={settings.totalWaterMl === amount} onClick={() => update('totalWaterMl', amount)}>
                {index + 1} {index === 0 ? 'cup' : 'cups'}
              </button>
            ))}
          </div>

          <div className="tune-controls">
            <Stepper id="total-water" label="Total recipe water" value={settings.totalWaterMl} min={150} max={1500} step={50} suffix="mL" onChange={(value) => update('totalWaterMl', value)} />
            <Stepper id="ratio" label="Coffee ratio" value={settings.ratio} min={10} max={20} step={0.1} suffix=": 1" onChange={(value) => update('ratio', value)} />

            <div className="range-field">
              <div className="range-field__label">
                <label htmlFor="ice-split">Ice split</label>
                <output htmlFor="ice-split">{settings.icePercent}%</output>
              </div>
              <input id="ice-split" type="range" min="20" max="50" step="1" value={settings.icePercent} onChange={(event) => update('icePercent', Number(event.target.value))} />
              <div className="range-field__ends" aria-hidden="true"><span>More extraction</span><span>More chill</span></div>
            </div>
          </div>
        </section>

        <section className="comic-panel comic-panel--brew" aria-labelledby="brew-title">
          <div className="panel-heading">
            <span aria-hidden="true">3.</span>
            <h2 id="brew-title">Brew</h2>
          </div>

          <div className="recipe-results" aria-live="polite">
            <div><strong>{formatCoffee(result.coffeeGrams)}<small>g</small></strong><span>Coffee</span></div>
            <div><strong>{result.hotWaterMl}<small>mL</small></strong><span>Hot water</span></div>
            <div><strong>{result.iceGrams}<small>g</small></strong><span>Ice</span></div>
          </div>

          {capacityWarning && (
            <div className="capacity-warning" role="alert">
              <strong>Whoa—too mighty for the {capacityWarning.brewer.shortName}.</strong>
              <p>{result.hotWaterMl} mL hot water exceeds its listed {capacityWarning.brewer.capacityMl} mL capacity. Use {capacityWarning.batches} batches or scale it down.</p>
              <button type="button" onClick={scaleToFit}>Scale to fit</button>
            </div>
          )}

          <div className="brew-actions">
            <img src={`${assetBase}graphics/ratio-hero-mascot.png`} alt="Cheerful illustrated ice cube pointing toward the timer button" />
            <div>
              <button className="primary-action" type="button" disabled={Boolean(capacityWarning)} onClick={() => setView('timer')}>START TIMER</button>
              <button className="text-action" type="button" onClick={copyRecipe}>Copy recipe</button>
              <p className="copy-status" aria-live="polite">{copyStatus}</p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <a href="https://www.youtube.com/watch?v=8uGGeV8A-BM" target="_blank" rel="noreferrer">James Hoffmann iced immersion method</a>
      </footer>
    </div>
  )
}
