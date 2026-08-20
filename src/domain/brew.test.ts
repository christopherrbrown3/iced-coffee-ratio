import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, calculateBrew, getCapacityWarning, getSteepSeconds } from './brew'

describe('calculateBrew', () => {
  it('matches Hoffmann’s two-cup source recipe', () => {
    expect(calculateBrew(DEFAULT_SETTINGS)).toMatchObject({
      coffeeGrams: 37.5,
      hotWaterMl: 330,
      iceGrams: 170,
      totalWaterMl: 500,
    })
  })

  it('rounds the one-cup source recipe to kitchen-friendly quantities', () => {
    expect(calculateBrew({ ...DEFAULT_SETTINGS, totalWaterMl: 250 })).toMatchObject({
      coffeeGrams: 19,
      hotWaterMl: 165,
      iceGrams: 85,
    })
  })

  it('keeps hot water and ice equal to total recipe water', () => {
    const result = calculateBrew({ ...DEFAULT_SETTINGS, totalWaterMl: 640, icePercent: 38 })
    expect(result.hotWaterMl + result.iceGrams).toBe(640)
  })

  it('warns when a full immersion batch exceeds brewer capacity', () => {
    expect(getCapacityWarning({ ...DEFAULT_SETTINGS, brewerId: 'switch-02' })).toMatchObject({
      batches: 2,
      overflowMl: 130,
    })
    expect(getCapacityWarning(DEFAULT_SETTINGS)).toBeNull()
  })

  it('uses a shorter steep for dark roasts', () => {
    expect(getSteepSeconds('light')).toBe(300)
    expect(getSteepSeconds('dark')).toBe(240)
  })
})
