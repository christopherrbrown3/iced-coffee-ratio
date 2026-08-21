import { describe, expect, it } from 'vitest'
import { BREWERS, DEFAULT_SETTINGS, RECIPES, calculateBrew, getCapacityWarning, getCompatibleBrewers, getRecipe, quantizeToStep, sanitizeSettings, type RecipeId } from './brew'

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

  it.each([
    ['counter-culture-flash', { coffeeGrams: 30, hotWaterMl: 335, iceGrams: 165 }],
    ['april-high-ice', { coffeeGrams: 20, hotWaterMl: 200, iceGrams: 200 }],
    ['kurasu-japanese', { coffeeGrams: 16, hotWaterMl: 150, iceGrams: 70 }],
    ['lance-low-ice', { coffeeGrams: 20, hotWaterMl: 240, iceGrams: 60 }],
    ['aeropress-japanese', { coffeeGrams: 20, hotWaterMl: 170, iceGrams: 150 }],
  ] satisfies [RecipeId, { coffeeGrams: number, hotWaterMl: number, iceGrams: number }][])('matches the %s source quantities', (recipeId, expected) => {
    const recipe = getRecipe(recipeId)
    expect(calculateBrew({
      ...DEFAULT_SETTINGS,
      ...recipe,
      totalWaterMl: recipe.sourceTotalWaterMl,
      recipeId: recipe.id,
      brewerId: recipe.defaultBrewerId,
    })).toMatchObject(expected)
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

  it('keeps recipe brewer choices faithful to each source method', () => {
    expect(getCompatibleBrewers('hoffmann').map(({ id }) => id)).toEqual(['switch-02', 'switch-03', 'clever', 'pulsar'])
    expect(getCompatibleBrewers('counter-culture-flash').map(({ id }) => id)).toEqual(['v60-02', 'april-brewer'])
    expect(getCompatibleBrewers('april-high-ice').map(({ id }) => id)).toEqual(['april-brewer'])
    expect(getCompatibleBrewers('kurasu-japanese').map(({ id }) => id)).toEqual(['v60-02'])
    expect(getCompatibleBrewers('lance-low-ice').map(({ id }) => id)).toEqual(['v60-02'])
  })

  it('falls back to the selected recipe brewer when saved settings are incompatible', () => {
    expect(sanitizeSettings({
      ...DEFAULT_SETTINGS,
      recipeId: 'april-high-ice',
      method: 'flash',
      brewerId: 'v60-02',
    })).toMatchObject({
      recipeId: 'april-high-ice',
      method: 'flash',
      brewerId: 'april-brewer',
    })
  })

  it('defines unique recipes with valid defaults, profiles, and brewer methods', () => {
    expect(new Set(RECIPES.map(({ id }) => id)).size).toBe(RECIPES.length)
    expect(new Set(RECIPES.map(({ timerProfileId }) => timerProfileId)).size).toBe(RECIPES.length)

    for (const recipe of RECIPES) {
      expect(recipe.supportedBrewerIds).toContain(recipe.defaultBrewerId)
      expect(recipe.supportedBrewerIds.length).toBeGreaterThan(0)
      for (const brewerId of recipe.supportedBrewerIds) {
        const brewer = BREWERS.find(({ id }) => id === brewerId)
        expect(brewer, `${recipe.id} references ${brewerId}`).toBeDefined()
        expect(brewer?.methods).toContain(recipe.method)
      }
    }
  })
})
