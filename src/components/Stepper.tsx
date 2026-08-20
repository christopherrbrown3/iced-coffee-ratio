import type { ChangeEvent } from 'react'

interface StepperProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (value: number) => void
}

export function Stepper({ id, label, value, min, max, step, suffix, onChange }: StepperProps) {
  const update = (next: number) => onChange(Math.min(Math.max(next, min), max))
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value)
    if (Number.isFinite(next)) update(next)
  }

  return (
    <div className="stepper">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="stepper__control">
        <button type="button" onClick={() => update(value - step)} aria-label={`Decrease ${label}`} disabled={value <= min}>−</button>
        <div className="stepper__value">
          <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={Number(value.toFixed(1))} onChange={handleInput} />
          {suffix && <span aria-hidden="true">{suffix}</span>}
        </div>
        <button type="button" onClick={() => update(value + step)} aria-label={`Increase ${label}`} disabled={value >= max}>+</button>
      </div>
    </div>
  )
}
