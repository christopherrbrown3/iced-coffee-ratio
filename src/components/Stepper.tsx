import { useLayoutEffect, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { clamp, quantizeToStep } from '../domain/brew'

interface StepperProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  inputStep?: number
  prefix?: string
  suffix?: string
  onChange: (value: number) => void
}

export function Stepper({ id, label, value, min, max, step, inputStep = step, prefix, suffix, onChange }: StepperProps) {
  const precision = Math.max(0, (inputStep.toString().split('.')[1] ?? '').length)
  const formatDraft = (next: number) => next.toFixed(precision)
  const [draft, setDraft] = useState(() => formatDraft(value))

  useLayoutEffect(() => {
    setDraft(formatDraft(value))
  }, [precision, value])

  const update = (next: number) => {
    const normalized = quantizeToStep(clamp(next, min, max), inputStep)
    setDraft(formatDraft(normalized))
    onChange(normalized)
  }

  const commitDraft = () => {
    if (draft.trim() === '') {
      setDraft(formatDraft(value))
      return
    }

    const next = Number(draft)
    if (Number.isFinite(next)) update(next)
    else setDraft(formatDraft(value))
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      event.preventDefault()
      setDraft(formatDraft(value))
    }
  }

  return (
    <div className="stepper">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="stepper__control">
        <button type="button" onClick={() => update(value - step)} aria-label={`Decrease ${label}`} disabled={value <= min}>−</button>
        <div className={`stepper__value${prefix ? ' stepper__value--prefixed' : ''}`}>
          {prefix && <span className="stepper__prefix" aria-hidden="true">{prefix}</span>}
          <input id={id} type="number" inputMode="decimal" min={min} max={max} step={inputStep} value={draft} aria-label={`${label}${prefix || suffix ? ` (${[prefix, suffix].filter(Boolean).join(' ')})` : ''}`} onChange={handleInput} onBlur={commitDraft} onKeyDown={handleKeyDown} onFocus={(event) => event.currentTarget.select()} />
          {suffix && <span className="stepper__suffix" aria-hidden="true">{suffix}</span>}
        </div>
        <button type="button" onClick={() => update(value + step)} aria-label={`Increase ${label}`} disabled={value >= max}>+</button>
      </div>
    </div>
  )
}
