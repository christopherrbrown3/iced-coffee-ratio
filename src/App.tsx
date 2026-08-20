import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { RECIPES, SOURCE_BATCHES, calculateBrew, formatCoffee, formatRatio, getBrewer, getCapacityWarning, getCompatibleBrewers, getMethodLabel, getRecipe, type BrewSettings, type RecipeId, type RoastLevel } from './domain/brew'
import { usePersistentSettings } from './hooks/usePersistentSettings'
import { Stepper } from './components/Stepper'
import { TimerView } from './components/TimerView'

type AppView = 'calculator' | 'timer'

export function App() {
  const [settings, setSettings] = usePersistentSettings()
  const [view, setView] = useState<AppView>('calculator')
  const [copyStatus, setCopyStatus] = useState('')
  const calculatorHeadingRef = useRef<HTMLHeadingElement>(null)
  const result = useMemo(() => calculateBrew(settings), [settings])
  const capacityWarning = useMemo(() => getCapacityWarning(settings), [settings])
  const brewer = getBrewer(settings.brewerId)
  const recipe = getRecipe(settings.recipeId)
  const compatibleBrewers = getCompatibleBrewers(settings.method)
  const assetBase = import.meta.env.BASE_URL
  const iceProgress = (settings.icePercent - 20) / 30 * 100

  const update = <K extends keyof BrewSettings>(key: K, value: BrewSettings[K]) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
      ...((key === 'ratio' || key === 'icePercent') ? { recipeId: 'custom' as const } : {}),
    }))
  }

  const selectRecipe = (id: RecipeId) => {
    if (id === 'custom') {
      setSettings((current) => ({ ...current, recipeId: 'custom' }))
      return
    }

    const selected = getRecipe(id)
    if (!selected) return
    setSettings((current) => ({
      ...current,
      recipeId: selected.id,
      method: selected.method,
      totalWaterMl: selected.totalWaterMl,
      ratio: selected.ratio,
      icePercent: selected.icePercent,
      brewerId: selected.defaultBrewerId,
    }))
  }

  const scaleToFit = () => {
    if (!capacityWarning) return
    const maxTotal = Math.floor(capacityWarning.brewer.capacityMl / (1 - settings.icePercent / 100))
    update('totalWaterMl', maxTotal)
  }

  const copyRecipe = async () => {
    const text = `Iced Coffee Calculator — ${formatCoffee(result.coffeeGrams)} g coffee, ${result.hotWaterMl} mL hot water, ${result.iceGrams} g ice. 1:${formatRatio(settings.ratio)} total-water ratio, ${settings.icePercent}% ice, ${brewer.name}.`
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('Recipe copied!')
    } catch {
      setCopyStatus('Copy unavailable—select the quantities above.')
    }
    window.setTimeout(() => setCopyStatus(''), 2500)
  }

  const closeTimer = () => {
    setView('calculator')
    window.requestAnimationFrame(() => calculatorHeadingRef.current?.focus())
  }

  if (view === 'timer') {
    return <TimerView settings={settings} result={result} onClose={closeTimer} />
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to calculator</a>
      <header className="masthead">
        <div className="masthead__text">
          <h1 ref={calculatorHeadingRef} tabIndex={-1} aria-label="Iced Coffee Calculator">
            <span>ICED COFFEE</span>
            <span>CALCULATOR</span>
          </h1>
        </div>
        <img src={`${assetBase}graphics/ice-mascot-coffee.png`} alt="Cheerful illustrated ice cube holding iced coffee and pointing toward the calculator title" />
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
              <select value={settings.recipeId} onChange={(event) => selectRecipe(event.target.value as RecipeId)}>
                {RECIPES.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                <option value="custom">Custom · {getMethodLabel(settings.method)}</option>
              </select>
            </label>
            <div className="recipe-context">
              <span>1:{formatRatio(settings.ratio)} total · {settings.icePercent}% ice · {getMethodLabel(settings.method)}</span>
              {recipe && <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">{recipe.sourceLabel} source ↗</a>}
            </div>
            <label className="select-field">
              <span>Brewer</span>
              <select value={settings.brewerId} onChange={(event) => update('brewerId', event.target.value as BrewSettings['brewerId'])}>
                {compatibleBrewers.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
          </div>
          {settings.method !== 'flash' && (
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
          )}
        </section>

        <section className="comic-panel comic-panel--tune" aria-labelledby="tune-title">
          <div className="panel-heading">
            <span aria-hidden="true">2.</span>
            <h2 id="tune-title">Tune</h2>
          </div>

          <div className="batch-presets" aria-label="Quick batch sizes">
            {SOURCE_BATCHES.slice(0, 3).map((amount) => (
              <button key={amount} type="button" aria-pressed={settings.totalWaterMl === amount} onClick={() => update('totalWaterMl', amount)}>
                {amount} mL
              </button>
            ))}
          </div>

          <div className="tune-controls">
            <Stepper id="total-water" label="Total water (hot + ice)" value={settings.totalWaterMl} min={150} max={1500} step={50} suffix="mL" onChange={(value) => update('totalWaterMl', value)} />
            <Stepper id="ratio" label="Coffee ratio" value={settings.ratio} min={10} max={20} step={0.1} prefix="1 :" onChange={(value) => update('ratio', value)} />

            <div className="range-field">
              <div className="range-field__label">
                <label htmlFor="ice-split">Ice split</label>
                <output htmlFor="ice-split">{settings.icePercent}%</output>
              </div>
              <div className="comic-range" style={{ '--range-progress': `${iceProgress}%` } as CSSProperties}>
                <div className="comic-range__track" aria-hidden="true">
                  <span className="comic-range__fill" />
                  <span className="comic-range__ticks">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</span>
                </div>
                <input id="ice-split" type="range" min="20" max="50" step="1" value={settings.icePercent} aria-valuetext={`${settings.icePercent} percent ice: ${result.iceGrams} grams ice and ${result.hotWaterMl} millilitres hot water`} onChange={(event) => update('icePercent', Number(event.target.value))} />
              </div>
              <div className="range-field__ends" aria-hidden="true"><span>20% · more hot water</span><span>50% · more ice</span></div>
              <p className="range-field__summary">{result.iceGrams} g ice + {result.hotWaterMl} mL hot</p>
            </div>
          </div>
        </section>

        <section className="comic-panel comic-panel--brew" aria-labelledby="brew-title">
          <div className="panel-heading">
            <span aria-hidden="true">3.</span>
            <h2 id="brew-title">Brew</h2>
          </div>

          <div className="recipe-results">
            <div><strong>{formatCoffee(result.coffeeGrams)}<small>g</small></strong><span>Coffee</span></div>
            <div><strong>{result.hotWaterMl}<small>mL</small></strong><span>Hot water</span></div>
            <div><strong>{result.iceGrams}<small>g</small></strong><span>Ice</span></div>
          </div>

          {capacityWarning && (
            <div className="capacity-warning" role="alert">
              <strong>Too much hot water for the {capacityWarning.brewer.shortName}.</strong>
              <p>{result.hotWaterMl} mL exceeds its listed {capacityWarning.brewer.capacityMl} mL capacity. Use {capacityWarning.batches} batches or scale down.</p>
              <button type="button" onClick={scaleToFit}>Scale to fit</button>
            </div>
          )}

          <div className="brew-actions">
            <img src={`${assetBase}graphics/ice-mascot-pointing.png`} alt="Cheerful illustrated ice cube pointing toward the timer button" />
            <div>
              <button className="primary-action" type="button" disabled={Boolean(capacityWarning)} onClick={() => setView('timer')}>START TIMER</button>
              <button className="text-action" type="button" onClick={copyRecipe}>Copy recipe</button>
              <p className="copy-status" aria-live="polite">{copyStatus}</p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        Recipe sources: {RECIPES.map((source, index) => (
          <span key={source.id}>{index > 0 && ' · '}<a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceLabel} ↗</a></span>
        ))}
      </footer>
    </div>
  )
}
