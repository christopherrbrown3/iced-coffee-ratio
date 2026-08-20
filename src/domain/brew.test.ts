import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, calculateBrew, getCapacityWarning, getRecipe, getSteepSeconds, quantizeToStep, sanitizeSettings } from './brew'

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

  it('never lets component rounding change the requested total', () => {
    for (let totalWaterMl = 150; totalWaterMl <= 1500; totalWaterMl += 1) {
      for (let icePercent = 20; icePercent <= 50; icePercent += 1) {
        const result = calculateBrew({ ...DEFAULT_SETTINGS, totalWaterMl, icePercent })
        expect(result.hotWaterMl + result.iceGrams).toBe(totalWaterMl)
      }
    }
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

  it('matches the Counter Culture flash-brew source quantities', () => {
    const recipe = getRecipe('counter-culture-flash')!
    expect(calculateBrew({
      ...DEFAULT_SETTINGS,
      ...recipe,
      recipeId: recipe.id,
      brewerId: recipe.defaultBrewerId,
    })).toMatchObject({ coffeeGrams: 30, hotWaterMl: 335, iceGrams: 165 })
  })

  it('matches the AeroPress Japanese flash source quantities', () => {
    const recipe = getRecipe('aeropress-japanese')!
    expect(calculateBrew({
      ...DEFAULT_SETTINGS,
      ...recipe,
      recipeId: recipe.id,
      brewerId: recipe.defaultBrewerId,
    })).toMatchObject({ coffeeGrams: 20, hotWaterMl: 170, iceGrams: 150 })
  })

  it('does not invent a capacity warning for a flow-through V60', () => {
    const recipe = getRecipe('counter-culture-flash')!
    expect(getCapacityWarning({
      ...DEFAULT_SETTINGS,
      ...recipe,
      totalWaterMl: 1500,
      recipeId: recipe.id,
      brewerId: 'v60-02',
    })).toBeNull()
  })

  it('migrates a saved custom recipe to a stable adjusted starting recipe', () => {
    expect(sanitizeSettings({
      ...DEFAULT_SETTINGS,
      recipeId: 'custom',
      method: 'aeropress',
      brewerId: 'switch-03',
      ratio: 14.4,
      icePercent: 45,
    })).toMatchObject({
      recipeId: 'aeropress-japanese',
      method: 'aeropress',
      brewerId: 'aeropress-original',
      ratio: 14.4,
      icePercent: 45,
    })
  })

  it('quantizes ratio changes to exactly what the interface displays', () => {
    expect(quantizeToStep(DEFAULT_SETTINGS.ratio + 0.1, 0.1)).toBe(13.4)
    expect(sanitizeSettings({ ...DEFAULT_SETTINGS, ratio: 13.433333333333334 }).ratio).toBe(13.4)
  })
})
