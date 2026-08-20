import { describe, expect, it } from 'vitest'
import { formatCountdownTime, formatTime } from './useBrewTimer'

describe('formatTime', () => {
  it('formats seconds as clock time', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(59.9)).toBe('0:59')
    expect(formatTime(300)).toBe('5:00')
  })

  it('never displays a negative time', () => {
    expect(formatTime(-10)).toBe('0:00')
  })

  it('does not drop a countdown second before it has elapsed', () => {
    expect(formatCountdownTime(299.7)).toBe('5:00')
    expect(formatCountdownTime(299)).toBe('4:59')
    expect(formatCountdownTime(-0.1)).toBe('0:00')
  })
})
