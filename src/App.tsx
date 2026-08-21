import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { RECIPES, SOURCE_BATCHES, calculateBrew, formatCoffee, formatRatio, getBrewer, getCapacityWarning, getCompatibleBrewers, getRecipe, isRecipeAdjusted, type BrewSettings, type RecipeId, type RoastLevel } from './domain/brew'
import { usePersistentSettings } from './hooks/usePersistentSettings'
import { Stepper } from './components/Stepper'
import { TimerView } from './components/TimerView'

type AppView = 'calculator' | 'timer'
const TIMER_HISTORY_KEY = 'icedCoffeeTimer'
const RECIPE_GROUPS = [
  { method: 'immersion', label: 'Immersion' },
  { method: 'flash', label: 'Flash pour-over' },
  { method: 'aeropress', label: 'AeroPress' },
] as const

export function App() {
  const [settings, setSettings] = usePersistentSettings()
  const [view, setView] = useState<AppView>('calculator')
  const [copyStatus, setCopyStatus] = useState('')
  const startTimerRef = useRef<HTMLButtonElement>(null)
  const viewRef = useRef(view)
  const result = useMemo(() => calculateBrew(settings), [settings])
  const capacityWarning = useMemo(() => getCapacityWarning(settings), [settings])
  const brewer = getBrewer(settings.brewerId)
  const recipe = getRecipe(settings.recipeId)
  const recipeAdjusted = isRecipeAdjusted(settings)
  const compatibleBrewers = getCompatibleBrewers(settings.recipeId)
  const assetBase = import.meta.env.BASE_URL
  const iceProgress = (settings.icePercent - 20) / 30 * 100

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    if (window.history.state?.[TIMER_HISTORY_KEY]) {
      const normalizedState = { ...window.history.state }
      delete normalizedState[TIMER_HISTORY_KEY]
      window.history.replaceState(normalizedState, '', `${window.location.pathname}${window.location.search}`)
    }

    const handlePopState = (event: PopStateEvent) => {
      if (viewRef.current === 'calculator' && event.state?.[TIMER_HISTORY_KEY]) setView('timer')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const update = <K extends keyof BrewSettings>(key: K, value: BrewSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const selectRecipe = (id: RecipeId) => {
    const selected = getRecipe(id)
    setSettings((current) => ({
      ...current,
      recipeId: selected.id,
      method: selected.method,
      ratio: selected.ratio,
      icePercent: selected.icePercent,
      brewerId: getCompatibleBrewers(selected.id).some((option) => option.id === current.brewerId)
        ? current.brewerId
        : selected.defaultBrewerId,
    }))
  }

  const resetRecipe = () => {
    setSettings((current) => ({
      ...current,
      ratio: recipe.ratio,
      icePercent: recipe.icePercent,
    }))
  }

  const scaleToFit = () => {
    if (!capacityWarning) return
    const maxTotal = Math.floor(capacityWarning.brewer.capacityMl / (1 - settings.icePercent / 100) / 50) * 50
    update('totalWaterMl', Math.max(150, maxTotal))
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

  const openTimer = () => {
    window.history.pushState({ ...window.history.state, [TIMER_HISTORY_KEY]: true }, '')
    setView('timer')
  }

  const closeTimer = useCallback((fromHistory = false) => {
    if (!fromHistory && window.history.state?.[TIMER_HISTORY_KEY]) window.history.back()
    setView('calculator')
    window.requestAnimationFrame(() => startTimerRef.current?.focus())
  }, [])

  if (view === 'timer') {
    return <TimerView settings={settings} result={result} onClose={closeTimer} />
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to calculator</a>
      <header className="masthead">
        <div className="masthead__text">
          <h1 aria-label="Iced Coffee Calculator">
            <span>ICED COFFEE</span>
            <span>CALCULATOR</span>
          </h1>
        </div>
        <img src={`${assetBase}graphics/ice-mascot-coffee.png`} width="1000" height="666" alt="" decoding="async" fetchPriority="high" />
      </header>

      <main id="main-content" className="comic-layout" tabIndex={-1}>
        <section className="comic-panel comic-panel--pick" aria-labelledby="pick-title">
          <div className="panel-heading">
            <span aria-hidden="true">1.</span>
            <h2 id="pick-title">Pick</h2>
          </div>
          <div className="pick-fields">
            <label className="select-field">
              <span>Starting recipe</span>
              <select value={settings.recipeId} aria-describedby="recipe-metrics" onChange={(event) => selectRecipe(event.target.value as RecipeId)}>
                {RECIPE_GROUPS.map((group) => (
                  <optgroup key={group.method} label={group.label}>
                    {RECIPES.filter((option) => option.method === group.method).map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="recipe-context">
              <span id="recipe-metrics">1:{formatRatio(settings.ratio)} total · {settings.icePercent}% ice</span>
              <div className="recipe-context__actions">
                {recipeAdjusted && <span className="recipe-context__badge">Adjusted</span>}
                <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" aria-label={`View the ${recipe.sourceLabel} recipe source`}>View source ↗</a>
                {recipeAdjusted && <button type="button" onClick={resetRecipe} aria-label={`Reset ratio and ice to the ${recipe.name} recipe`}>Reset</button>}
              </div>
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

          <div className="batch-presets" role="group" aria-label="Quick batch sizes">
            {SOURCE_BATCHES.slice(0, 3).map((amount) => (
              <button key={amount} type="button" aria-pressed={settings.totalWaterMl === amount} onClick={() => update('totalWaterMl', amount)}>
                {amount} mL
              </button>
            ))}
          </div>

          <div className="tune-controls">
            <Stepper id="total-water" label="Total water (hot + ice)" value={settings.totalWaterMl} min={150} max={1500} step={50} inputStep={1} suffix="mL" onChange={(value) => update('totalWaterMl', value)} />
            <Stepper id="ratio" label="Coffee ratio" value={settings.ratio} min={10} max={20} step={0.1} prefix="1:" onChange={(value) => update('ratio', value)} />

            <div className="range-field">
              <div className="range-field__label">
                <label htmlFor="ice-split">Ice split</label>
                <span className="range-field__value" aria-hidden="true">{settings.icePercent}%</span>
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

          <output
            className="recipe-results"
            htmlFor="total-water ratio ice-split"
            aria-label={`Recipe result: ${formatCoffee(result.coffeeGrams)} grams coffee, ${result.hotWaterMl} millilitres hot water, and ${result.iceGrams} grams ice`}
            aria-atomic="true"
          >
            <div><strong>{formatCoffee(result.coffeeGrams)}<small>g</small></strong><span>Coffee</span></div>
            <div><strong>{result.hotWaterMl}<small>mL</small></strong><span>Hot water</span></div>
            <div><strong>{result.iceGrams}<small>g</small></strong><span>Ice</span></div>
          </output>

          {capacityWarning && (
            <div id="capacity-warning" className="capacity-warning" role="alert">
              <strong>Too much hot water for the {capacityWarning.brewer.shortName}.</strong>
              <p>{result.hotWaterMl} mL exceeds its listed {capacityWarning.brewer.capacityMl} mL capacity. Scale down or choose a larger brewer.</p>
              <button type="button" onClick={scaleToFit}>Scale to fit</button>
            </div>
          )}

          <div className="brew-actions">
            <img src={`${assetBase}graphics/coffee-cup-mascots.png`} width="900" height="600" alt="" loading="lazy" decoding="async" />
            <div>
              <button ref={startTimerRef} className="primary-action" type="button" disabled={Boolean(capacityWarning)} aria-describedby={capacityWarning ? 'capacity-warning' : undefined} onClick={openTimer}>START TIMER</button>
              <button className="text-action" type="button" onClick={copyRecipe}>Copy recipe</button>
              <p className="copy-status" role="status">{copyStatus}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
